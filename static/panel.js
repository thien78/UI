// Panel.js - Manages the interactive data table display
// This class tracks and displays data changes from various sources

/**
 * DataPanel class for managing the interactive data display
 * Responsible for:
 * - Tracking data changes from different sources
 * - Adding new data entries to the table
 * - Limiting the number of rows displayed
 * - Handling the UI elements
 */
class DataPanel {
    constructor(maxRows = 100) {
        this.maxRows = maxRows;
        this.dataEntries = [];
        this.filterSource = 'all'; // 'all', 'door', 'connection', 'ranging'
          // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.tableBody = document.getElementById('data-table-body');
            this.setupFilterControls();
            this.setupTogglePanel();
            
            if (!this.tableBody) {
                console.error('Table body element not found!');
            }
        });
    }
    
    /**
     * Set up filter controls for the data panel
     */    
    setupFilterControls() {
        const filterContainer = document.getElementById('data-filter');
        if (!filterContainer) return;
        
        // Create filter buttons
        const sources = ['all', 'door', 'connection', 'ranging', 'user'];
        sources.forEach(source => {
            const btn = document.createElement('button');
            btn.textContent = source.charAt(0).toUpperCase() + source.slice(1);
            btn.classList.add('filter-btn');
            if (source === this.filterSource) {
                btn.classList.add('active');
            }
            
            btn.addEventListener('click', () => {
                // Update active button
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Apply filter
                this.filterSource = source;
                this.updateTableUI();
            });
            
            filterContainer.appendChild(btn);
        });
        
        // Add clear button
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.classList.add('clear-btn');
        clearBtn.addEventListener('click', () => {
            this.clearEntries();
        });
        filterContainer.appendChild(clearBtn);
        
        // Add help tooltip
        const helpTip = document.createElement('span');
        helpTip.classList.add('help-tip');
        helpTip.textContent = '?';
        helpTip.title = 'This panel shows real-time updates from door status, connection status, and ranging data';
        filterContainer.appendChild(helpTip);
    }
    
    /**
     * Clear all entries from the table
     */
    clearEntries() {
        this.dataEntries = [];
        this.updateTableUI();
        // Add a "cleared" message
        this.addEntry('System', 'Table Cleared', 'All entries', 'None');
    }

    /**
     * Add new data entry to the table
     * @param {string} source - The source of the data (door, connection, ranging)
     * @param {string} eventType - Type of event (status change, etc)
     * @param {string} previousValue - Previous value
     * @param {string} newValue - New value
     * @param {Date} timestamp - When the change occurred (defaults to now)
     */
    addEntry(source, eventType, previousValue, newValue, timestamp = new Date()) {
        // Create the data entry object
        const entry = {
            source,
            eventType,
            previousValue: previousValue !== undefined ? previousValue : 'N/A',
            newValue: newValue !== undefined ? newValue : 'N/A',
            timestamp
        };

        // Add to the beginning of the array
        this.dataEntries.unshift(entry);
        
        // Limit the number of entries
        if (this.dataEntries.length > this.maxRows) {
            this.dataEntries = this.dataEntries.slice(0, this.maxRows);
        }
        
        // Update the UI
        this.updateTableUI();
    }
      /**
     * Update the table UI based on current data entries
     */
    updateTableUI() {
        if (!this.tableBody) return;
        
        // Clear the table
        this.tableBody.innerHTML = '';
        
        // Filter entries if needed
        const filteredEntries = this.filterSource === 'all' 
            ? this.dataEntries 
            : this.dataEntries.filter(entry => 
                entry.source.toLowerCase() === this.filterSource.toLowerCase());
        
        // Add each entry to the table
        filteredEntries.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // Format the timestamp
            const timeString = entry.timestamp.toLocaleTimeString();
            
            // Create cells
            row.innerHTML = `
                <td>${entry.source}</td>
                <td>${entry.eventType}</td>
                <td>${entry.previousValue}</td>
                <td>${entry.newValue}</td>
                <td>${timeString}</td>
            `;
            
            // Highlight row if it's the most recent change
            if (index === 0) {
                row.classList.add('highlight');
                
                // Add animation for new entries
                row.classList.add('new-entry');
                setTimeout(() => {
                    row.classList.remove('new-entry');
                }, 2000);
            }
            
            // Add alternating row colors
            if (index % 2 === 1) {
                row.classList.add('alt-row');
            }
            
            this.tableBody.appendChild(row);
        });
        
        // Update counter if it exists
        const counter = document.getElementById('entry-counter');
        if (counter) {
            counter.textContent = `${filteredEntries.length} entries`;
        }
    }
    
    /**
     * Set up toggle panel functionality
     */
    setupTogglePanel() {
        const toggleBtn = document.getElementById('toggle-panel');
        const dataPanel = document.getElementById('data-panel');
        
        if (!toggleBtn || !dataPanel) return;
        
        toggleBtn.addEventListener('click', () => {
            // Toggle minimized state
            dataPanel.classList.toggle('minimized');
            
            // Update button text
            if (dataPanel.classList.contains('minimized')) {
                toggleBtn.textContent = '+';
                toggleBtn.title = 'Expand';
            } else {
                toggleBtn.textContent = '−';
                toggleBtn.title = 'Minimize';
            }
        });
    }
}

// Create and export the DataPanel instance
export const dataPanel = new DataPanel();

// Initialize by adding a startup entry
document.addEventListener('DOMContentLoaded', () => {
    dataPanel.addEntry('System', 'Initialization', 'N/A', 'Started', new Date());
});
