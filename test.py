import requests
import random
import math
import numpy as np
import time

SERVER_URL = 'http://127.0.0.1/api'
# SERVER_URL = 'http://10.102.50.15/api'


class PositionGenerator:
    def __init__(self, rect_corners=((-1.5, 2.5), (1.5, -2.5)), max_radius=10):
        """
        Initialize the position generator.
        Args:
            rect_corners: Tuple of diagonal corners ((x1, y1), (x2, y2))
            max_radius: Maximum distance from rectangle center
        """
        (x1, y1), (x2, y2) = rect_corners
        self.x_min, self.x_max = min(x1, x2), max(x1, x2)
        self.y_min, self.y_max = min(y1, y2), max(y1, y2)

        self.center_x = (self.x_min + self.x_max) / 2
        self.center_y = (self.y_min + self.y_max) / 2
        self.width = self.x_max - self.x_min
        self.height = self.y_max - self.y_min
        self.half_diagonal = math.sqrt((self.width / 2) ** 2 + (self.height / 2) ** 2)
        self.max_radius = max_radius

        initial_angle = 60
        initial_distance = 200

        self.current_distance = initial_distance
        self.current_angle_rad = initial_angle
        self.current_angle_deg = math.degrees(initial_angle)

        self.distance_step_range = (0.25, 0.5)
        self.angle_step_range = (0.1, 6)

    def get_next_position(self):
        distance_direction = random.choice([-1, 1])
        angle_direction = 1
        distance_step = random.uniform(*self.distance_step_range)
        angle_step = random.uniform(*self.angle_step_range)
        new_distance = self.current_distance + (distance_direction * distance_step)
        new_distance = max(self.half_diagonal, min(new_distance, self.max_radius))
        new_angle_deg = self.current_angle_deg + (angle_direction * angle_step)
        new_angle_deg = new_angle_deg % 360
        new_angle_rad = math.radians(new_angle_deg)
        new_x = self.center_x + new_distance * math.cos(new_angle_rad)
        new_y = self.center_y + new_distance * math.sin(new_angle_rad)

        if self.x_min <= new_x <= self.x_max and self.y_min <= new_y <= self.y_max:
            return self.get_next_position()

        self.current_distance = new_distance
        self.current_angle_rad = new_angle_rad
        self.current_angle_deg = new_angle_deg
        return [self.current_distance * 100, self.current_angle_deg]


position_gen = PositionGenerator()


def generate_random_ranging_data():
    global position_gen
    distance, angle = position_gen.get_next_position()
    base_power = -30
    distance_factor = (distance / 100) ** 2
    power = base_power - 20 * math.log10(distance_factor)
    power = power + random.uniform(-5, 5)
    power = max(-80, min(-30, power))
    return {
        "FirstPathPower": round(power, 1),
        "AOA": round(angle, 2),
        "Distance": round(distance, 2)
    }


def set_connection_status(vehicle_status, ble_status, uwb_status, door_states=None, ranging_data=None):
    door_data = {
        "FrontLeft": ["close", "lock"],
        "FrontRight": ["close", "lock"],
        "RearLeft": ["close", "lock"],
        "RearRight": ["close", "lock"],
        "Trunk": ["close", "lock"]
    }

    if door_states:
        for door, state in door_states.items():
            if door in door_data:
                door_data[door] = state

    hpc_data_dict = {
        "Connection": {
            "VehicleStatus": vehicle_status,
            "BleStatus": ble_status,
            "UwbStatus": uwb_status,
        },
        "Door": door_data,
        "Ranging": ranging_data,
        "Device_ID": 0xFF
    }
    response = requests.post(SERVER_URL, json=hpc_data_dict)
    if response.ok:
        print('Status updated:', response.json())
    else:
        print('Failed to update status:', response.status_code, response.text)


def set_door_status(door_command, current_door_states=None):
    door_command_map = {
        'fl_open': ('FrontLeft', 0, 'open'),
        'fl_close': ('FrontLeft', 0, 'close'),
        'fl_lock': ('FrontLeft', 1, 'lock'),
        'fl_unlock': ('FrontLeft', 1, 'unlock'),
        'fr_open': ('FrontRight', 0, 'open'),
        'fr_close': ('FrontRight', 0, 'close'),
        'fr_lock': ('FrontRight', 1, 'lock'),
        'fr_unlock': ('FrontRight', 1, 'unlock'),
        'rl_open': ('RearLeft', 0, 'open'),
        'rl_close': ('RearLeft', 0, 'close'),
        'rl_lock': ('RearLeft', 1, 'lock'),
        'rl_unlock': ('RearLeft', 1, 'unlock'),
        'rr_open': ('RearRight', 0, 'open'),
        'rr_close': ('RearRight', 0, 'close'),
        'rr_lock': ('RearRight', 1, 'lock'),
        'rr_unlock': ('RearRight', 1, 'unlock'),
        't_open': ('Trunk', 0, 'open'),
        't_close': ('Trunk', 0, 'close'),
        't_lock': ('Trunk', 1, 'lock'),
        't_unlock': ('Trunk', 1, 'unlock')
    }

    door_states = {
        "FrontLeft": ["close", "lock"],
        "FrontRight": ["close", "lock"],
        "RearLeft": ["close", "lock"],
        "RearRight": ["close", "lock"],
        "Trunk": ["close", "lock"]
    }

    if current_door_states:
        for door, state in current_door_states.items():
            if door in door_states:
                door_states[door] = state

    if door_command not in door_command_map:
        valid_commands = ', '.join(door_command_map.keys())
        return False, door_states, "Invalid door command. Valid commands: {}".format(valid_commands)

    door, index, value = door_command_map[door_command]
    door_state = door_states[door].copy()
    door_state[index] = value
    door_states[door] = door_state
    return True, door_states, "Updated {} state to {}, {}".format(door, door_state[0], door_state[1])


if __name__ == "__main__":
    vehicle_status = 'Sleep'
    ble_status = 'Disconnected'
    uwb_status = 'NA'
    ranging_data = None

    door_states = {
        "FrontLeft": ["close", "lock"],
        "FrontRight": ["close", "lock"],
        "RearLeft": ["close", "lock"],
        "RearRight": ["close", "lock"],
        "Trunk": ["close", "lock"]
    }

    vehicle_status_values = ['Sleep', 'Awake']
    ble_status_values = ['Connected', 'Disconnected']
    uwb_status_values = ['NA', 'Ranging', 'CPD', 'Mixed']

    door_command_map = {
        'fl_open': ('FrontLeft', 0, 'open'),
        'fl_close': ('FrontLeft', 0, 'close'),
        'fl_lock': ('FrontLeft', 1, 'lock'),
        'fl_unlock': ('FrontLeft', 1, 'unlock'),
        'fr_open': ('FrontRight', 0, 'open'),
        'fr_close': ('FrontRight', 0, 'close'),
        'fr_lock': ('FrontRight', 1, 'lock'),
        'fr_unlock': ('FrontRight', 1, 'unlock'),
        'rl_open': ('RearLeft', 0, 'open'),
        'rl_close': ('RearLeft', 0, 'close'),
        'rl_lock': ('RearLeft', 1, 'lock'),
        'rl_unlock': ('RearLeft', 1, 'unlock'),
        'rr_open': ('RearRight', 0, 'open'),
        'rr_close': ('RearRight', 0, 'close'),
        'rr_lock': ('RearRight', 1, 'lock'),
        'rr_unlock': ('RearRight', 1, 'unlock'),
        't_open': ('Trunk', 0, 'open'),
        't_close': ('Trunk', 0, 'close'),
        't_lock': ('Trunk', 1, 'lock'),
        't_unlock': ('Trunk', 1, 'unlock')
    }

    status_mapping = {}
    for val in vehicle_status_values:
        status_mapping[val.lower()] = 'vehicle'
    for val in ble_status_values:
        status_mapping[val.lower()] = 'ble'
    for val in uwb_status_values:
        status_mapping[val.lower()] = 'uwb'

    print("Type 'exit' to quit.")
    print("Current status: Vehicle={}, BLE={}, UWB={}".format(vehicle_status, ble_status, uwb_status))
    print("Current door states:")
    for door, state in door_states.items():
        print("  {}: {}, {}".format(door, state[0], state[1]))
    print("Connection status inputs: {}".format(', '.join(list(status_mapping.keys()))))
    print("Door command format examples: 'fl_open', 'rr_lock', 't_unlock'")
    print("  fl=FrontLeft, fr=FrontRight, rl=RearLeft, rr=RearRight, t=Trunk")

    last_vehicle_status = vehicle_status
    last_ble_status = ble_status
    last_uwb_status = uwb_status
    last_door_states = door_states.copy()
    need_to_update_server = False

    while True:
        user_input = input("Enter a command: ").strip().lower()

        if user_input == 'exit':
            set_connection_status(
                "sleep",
                "disconnected",
                "na",
                {
                    "FrontLeft": ["close", "lock"],
                    "FrontRight": ["close", "lock"],
                    "RearLeft": ["close", "lock"],
                    "RearRight": ["close", "lock"],
                    "Trunk": ["close", "lock"]
                },
                {
                    "FirstPathPower": 0,
                    "AOA": 0,
                    "Distance": 0
                }
            )
            break

        if user_input in door_command_map:
            success, updated_door_states, message = set_door_status(user_input, last_door_states)
            if success:
                last_door_states = updated_door_states
                print(message)
                try:
                    set_connection_status(last_vehicle_status, last_ble_status, last_uwb_status, last_door_states, ranging_data)
                    print("Door status sent to server.")
                except Exception as e:
                    print("Error sending door status to server: {}".format(str(e)))
            else:
                print(message)

        elif user_input in status_mapping:
            status_type = status_mapping[user_input]
            need_to_update_server = True
            if status_type == 'vehicle':
                last_vehicle_status = user_input.capitalize()
            elif status_type == 'ble':
                last_ble_status = user_input.capitalize()
            elif status_type == 'uwb':
                last_uwb_status = user_input.capitalize()

            print("Updated status: Vehicle={}, BLE={}, UWB={}".format(last_vehicle_status, last_ble_status, last_uwb_status))
            if need_to_update_server:
                try:
                    ranging_data = generate_random_ranging_data()
                    set_connection_status(last_vehicle_status, last_ble_status, last_uwb_status, last_door_states, ranging_data)
                    print("Connection status sent to server.")
                    need_to_update_server = False
                except Exception as e:
                    print("Error sending connection status to server: {}".format(str(e)))
        else:
            while True:
                try:
                    ranging_data = generate_random_ranging_data()
                    set_connection_status(last_vehicle_status, last_ble_status, last_uwb_status, last_door_states, ranging_data)
                    print("Connection status sent to server.")
                    time.sleep((288 + 20) / 1000)
                except KeyboardInterrupt:
                    break
            continue
