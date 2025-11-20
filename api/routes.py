from flask import Blueprint, jsonify, request
import math
import time


TCP_HPC_PORT = 8888

#file structure shall be organize as such:
# SCA-E2E-SERVER/
# │
# ├── app.py
# │
# ├── api/
# │   └── *.py
# ├── templates/
# │   └── *.html
# └── static/
#     └── *.json
#     └── *.css
#     └── *.glb
#     └── *.js


#Default datas will be defined by server
#Communication between Client and Server is TCP - HTTP format
#Client shall fetch info from Server less than 60 request/s through a Json packet
#Serve need to provide 3 routes for Client to use:
#   \connection : Contain Vehicle, Uwb, Ble status
#   "Connection": {
#         "VehicleStatus" : "Sleep", #[Sleep, Awake]
#         "BleStatus" : "Disconnected", # [Connected, Disconnected]
#         "UwbStatus": "NA",   #  [NA, Ranging, CPD, Mixed]
#     },
#   \door : Contain all doors states
#   "Door": {
#           "FrontLeft":["close" , "lock"], #[open, close] , [lock, unlock]
#           "FrontRight":["close" , "lock"],
#           "RearLeft":["close" , "lock"],
#           "RearRight":["close" , "lock"],
#           "Trunk":["close" , "lock"]
#       },
#   \ranging : Contain Turning angle, Coordinate (x,y), Speed, FirstPathPower, distance from (0,0)
    # "Ranging": {
    #     "FirstPathPower" : 0,
    #     "Coordinate": [x,y], # dbm
    #     "TurningAngle" : 0,
    #     "Speed": 0, # degree
    #     "Distance":0, # cm
    # }
#Panel
#   Shall display everything info live from Server to Client place at the conner

#Connection 
#   UwbStatus : Define color maping for each state
#       NA : Pink, Ranging : Green, CPD : Yellow, Mixed : Purlple
#   BleStatus : Define color maping for each state
#       Connected : Blue, Disconnected : Red
#   Change brightness of the vechicle model based on VehicleStatus
#       Sleep : birghtness = 30%, Awake : brightness = 100%
#   Color shall be handle on client side
#   Color transition like blinking, overlayed the model,... shall be handle on client
#   Flash matching overlayed color according to currenwt UwbStatus and BleStatus all of the vehicle model
#       Client shall flash 2 times for half of second
#   Prioritize color BleStatus > UwbStatus
#   Generate User model when change to UwbStatus (Ranging or Mixed) and facing (0,0)
#       Server have to distinguish the initial state to prevent error
#       Client have to identify the original angle when first load in to compenstate with the initial A0A : Turning to (0,0) = Load Angle - (A0A - pi)
#       Client shall roate the User Model with newly calculate angle so that the User Model will face (0,0)
#
#Door
#   Open -> Close status will be realized by the closing animation of the Door model
#       Client shall fetch Door status from Server
#       CLient shall animate Door movement
#   Close -> Open status will be realized by the opening animation of the Door model
#   Lock status will be mapped as red color for each door
#   Unlock status will be mapped as green color each door
#   Lock -> Unlock status will be realized by flashing Unclock color overlayed the Door Model and vice versa
#       Client shall fetch Door status from Server
#       CLient shall animate Blinking animation for each DOOR
#    
#Ranging
#   Generate a line connecting from User Model to (0,0) coordinate when UwbStatus != (NA or CPD) called DistanceLine
#       Client shall fetch UwbStatus status from Server
#       Client shall load a line model connecting (0,0) with User Model
#   First Path Power value will be mapped as a color range - Cyan and opacity of DistanceLine
#       Client shall ...
#   Flashing DistanceLine if First Path Power below a certant level : below -10 dbm
#       Client shall fetch First Path Power value from Server
#       Client shall ...
#   A0A and Distance will generate User model turning angle and next moving position
#       Server shall ...
#   Distance value will display on the DistanceLine
#       Client shall fetch distance value from Server
#       Client shall ...


hpc_data_dict = {
    #Info and Vehicle notification
    "Connection": {
        "VehicleStatus" : "Sleep", #[Sleep, Awake]
        "BleStatus" : "Disconnected", # [Connected, Disconnected]
        "UwbStatus": "NA",   #  [NA, Ranging, CPD, Mixed]
    },
    # Vehicle Door model
    "Door": {
        "FrontLeft":["close" , "lock"], #[open, close] , [lock, unlock]
        "FrontRight":["close" , "lock"],
        "RearLeft":["close" , "lock"],
        "RearRight":["close" , "lock"],
        "Trunk":["close" , "lock"]
    },
    # User model
    "Ranging": {
        "FirstPathPower":0, # dbm
        "AOA":0.0, # degree
        "Distance":0, # cm
    },
    "Device_ID" : 0xFF # 0xFF : Unknown, ...
}

ui_data_dict = {
    #Info and Vehicle notification
    "Connection": {
        "VehicleStatus" : "Sleep", #[Sleep, Awake]
        "BleStatus" : "Disconnected", # [Connected, Disconnected]
        "UwbStatus": "NA",   #  [NA, Ranging, CPD, Mixed]
    },
    # Vehicle Door model
    "Door": {
        "FrontLeft":["close" , "lock"], #[open, close] , [lock, unlock]
        "FrontRight":["close" , "lock"],
        "RearLeft":["close" , "lock"],
        "RearRight":["close" , "lock"],
        "Trunk":["close" , "lock"]
    },
    # User model
    "Ranging": {
        "FirstPathPower":0, # dbm
        "AOA":0.0, # degree
        "Distance":0, # cm
    },
    "User": {
        "x": 0,
        "y": 0,
        "TurnAngle": 0.0
    },
    "Device_ID" : 0xFF # 0xFF : Unknown, ...
}

api_bp = Blueprint("api_service", __name__)


def get_xy(CylindCoord):
    angale_rad = math.radians(CylindCoord["Ranging"]["AOA"])
    x = CylindCoord["Ranging"]["Distance"] * math.cos(angale_rad)
    y = CylindCoord["Ranging"]["Distance"] * math.sin(angale_rad)
    return x, y

def reset_getTurnAngle():
    if hasattr(getTurnAngle, 'past_position'):
        del getTurnAngle.past_position
    if hasattr(getTurnAngle, 'current_position'):
        del getTurnAngle.current_position

def getTurnAngle(new_position):
    # Access position history from function attributes
    if not hasattr(getTurnAngle, 'current_position'):
        # Initialize position history on first call
        getTurnAngle.current_position = {"x": 0, "y": 0}
        angle_rad = math.atan2(new_position["y"], new_position["x"]) - math.pi
    else:
    
        try:
            angle_rad = math.atan((new_position["y"] - getTurnAngle.current_position["y"])/(new_position["x"] - getTurnAngle.current_position["x"]))
            if( new_position["x"] < getTurnAngle.current_position["x"]):
                angle_rad += math.pi
        except ZeroDivisionError:
            angle_rad = math.pi / 2 if new_position["y"] > getTurnAngle.current_position["y"] else -math.pi / 2
    
    getTurnAngle.current_position = new_position
    
    return angle_rad

def convert_hpc2ui(hpc_data_dict: dict):
    global ui_data_dict
    ui_data_dict["Connection"] = hpc_data_dict["Connection"]
    ui_data_dict["Door"] = hpc_data_dict["Door"]
    #Only update User model when UwbStatus is Ranging or Mixed
    if(ui_data_dict["Connection"]["UwbStatus"] == "Ranging" or ui_data_dict["Connection"]["UwbStatus"] == "Mixed"):
        ui_data_dict["Ranging"] = hpc_data_dict["Ranging"]
        ui_data_dict["User"]["x"], ui_data_dict["User"]["y"]  = get_xy(hpc_data_dict)
        ui_data_dict["User"]["TurnAngle"] = getTurnAngle({"x": ui_data_dict["User"]["x"], "y": ui_data_dict["User"]["y"]})
    else:
        reset_getTurnAngle()
        ui_data_dict["Ranging"] = { "FirstPathPower":0, # dbm
                                    "AOA":0.0, # degree
                                    "Distance":0, # cm
                                    }

        ui_data_dict["User"]= { "x": 0,
                                "y": 0,
                                "TurnAngle": 0.0}


last_request_time= None

@api_bp.route('/', methods=['POST'])
def post_data():
    global last_request_time
    current_time = time.time()

    if last_request_time is not None:
        time_different = current_time - last_request_time
        print(f"[+] Time since last HPC POST: {time_different:.4f} secs")
    
    last_request_time = current_time

    convert_hpc2ui(request.get_json())

    return jsonify({
        "status": "success",
        "recieved": request.get_json(),
    }), 200
    
@api_bp.route('/connection')
def get_connection():
    return jsonify(ui_data_dict["Connection"])

@api_bp.route('/door')
def get_door():
    return jsonify(ui_data_dict["Door"])

@api_bp.route('/ranging')
def get_ranging():
    return jsonify(ui_data_dict["Ranging"])

@api_bp.route('/user')
def get_animation_state():
    return jsonify(ui_data_dict["User"])
