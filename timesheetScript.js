// Global Variables
var timerInterval = null;
var startTime = null;
var records = [];
var runningTask = null;
var tempEndTime = null;
var editingIndex = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadRecords();
    displayRecords();
    loadRunningTask();
});

// Timer Functions
function startTimer() {
    if (!validateForm()) {
        alert('Please fill in all required fields!');
        return;
    }

    startTime = new Date();
    document.getElementById('startTimeDisplay').textContent = formatTime(startTime);
    document.getElementById('endTimeDisplay').textContent = '--:--:--';

    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;

    disableFormInputs(true);

    runningTask = {
        startTime: startTime.toISOString(),
        project: document.getElementById('project').value,
        category: document.getElementById('category').value,
        taskType: document.getElementById('taskType').value,
        role: document.getElementById('role').value,
        workname: document.getElementById('workname').value,
        remark: document.getElementById('remark').value
    };
    localStorage.setItem('runningTask', JSON.stringify(runningTask));

    timerInterval = setInterval(updateTimer, 1000);
    updateTimer(); // Call immediately to show the timer
}

function updateTimer() {
    if (!startTime) return;

    var now = new Date();
    var diff = now - startTime;

    var hours = Math.floor(diff / 3600000);
    var minutes = Math.floor((diff % 3600000) / 60000);
    var seconds = Math.floor((diff % 60000) / 1000);

    document.getElementById('timerDisplay').textContent = 
        pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}

function showStatusModal() {
    if (!startTime) return;

    tempEndTime = new Date();
    clearInterval(timerInterval);
    document.getElementById('endTimeDisplay').textContent = formatTime(tempEndTime);
    document.getElementById('modalRemark').value = document.getElementById('remark').value;
    document.getElementById('statusModal').classList.remove('hidden');
}

function cancelStop() {
    document.getElementById('statusModal').classList.add('hidden');
    document.getElementById('endTimeDisplay').textContent = '--:--:--';
    timerInterval = setInterval(updateTimer, 1000);
    tempEndTime = null;
}

function confirmStop() {
    const status = document.getElementById('modalStatus').value;
    const finalRemark = document.getElementById('modalRemark').value;

    document.getElementById('statusModal').classList.add('hidden');

    const record = {
        date: formatDate(startTime),
        project: document.getElementById('project').value,
        category: document.getElementById('category').value,
        taskType: document.getElementById('taskType').value,
        role: document.getElementById('role').value,
        workname: document.getElementById('workname').value,
        status: status,
        startTime: formatTime(startTime),
        endTime: formatTime(tempEndTime),
        remark: finalRemark
    };

    records.push(record);
    saveRecords();
    displayRecords();

    localStorage.removeItem('runningTask');
    runningTask = null;

    resetTimer();
}

function resetTimer() {
    document.getElementById('timerDisplay').textContent = '00:00:00';
    document.getElementById('startTimeDisplay').textContent = '--:--:--';
    document.getElementById('endTimeDisplay').textContent = '--:--:--';

    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;

    startTime = null;
    tempEndTime = null;

    disableFormInputs(false);

    document.getElementById('project').value = '';
    document.getElementById('category').value = '';
    document.getElementById('taskType').value = '';
    document.getElementById('role').value = '';
    document.getElementById('workname').value = '';
    document.getElementById('remark').value = '';

    document.getElementById('modalStatus').value = 'Completed';
    document.getElementById('modalRemark').value = '';
}

// Edit Functions
function editRecord(index) {
    editingIndex = index;
    const record = records[index];

    // Parse date
    const dateParts = record.date.split('/');
    const dateStr = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;

    document.getElementById('editDate').value = dateStr;
    document.getElementById('editProject').value = record.project;
    document.getElementById('editCategory').value = record.category;
    document.getElementById('editTaskType').value = record.taskType;
    document.getElementById('editRole').value = record.role;
    document.getElementById('editWorkname').value = record.workname;
    document.getElementById('editStartTime').value = record.startTime;
    document.getElementById('editEndTime').value = record.endTime;
    document.getElementById('editStatus').value = record.status;
    document.getElementById('editRemark').value = record.remark;

    document.getElementById('editModal').classList.remove('hidden');
}

function saveEdit() {
    const dateInput = document.getElementById('editDate').value;
    const dateParts = dateInput.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

    records[editingIndex] = {
        date: formattedDate,
        project: document.getElementById('editProject').value,
        category: document.getElementById('editCategory').value,
        taskType: document.getElementById('editTaskType').value,
        role: document.getElementById('editRole').value,
        workname: document.getElementById('editWorkname').value,
        status: document.getElementById('editStatus').value,
        startTime: document.getElementById('editStartTime').value,
        endTime: document.getElementById('editEndTime').value,
        remark: document.getElementById('editRemark').value
    };

    saveRecords();
    displayRecords();
    closeEditModal();
    showNotification('Record updated successfully!');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    editingIndex = null;
}

// Excel Export Function
function exportToExcel() {
    if (records.length === 0) {
        alert('No records to export!');
        return;
    }

    const wsData = [
        ['Date', 'No.', 'Project ID', 'Category', 'Task Type', 'Role',
            'Work Product Name / Task Description / Activity', 'Start Time', 'End Time',
            'Status', 'Remark (Pls define Actual Work Product Size, etc. when status = Complete)']
    ];

    records.forEach((record, index) => {
        wsData.push([
            record.date,
            index + 1,
            record.project,
            record.category,
            record.taskType,
            record.role,
            record.workname,
            record.startTime,
            record.endTime,
            record.status,
            record.remark
        ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
        { wch: 12 }, { wch: 5 }, { wch: 15 }, { wch: 15 },
        { wch: 20 }, { wch: 25 }, { wch: 40 }, { wch: 10 },
        { wch: 10 }, { wch: 12 }, { wch: 50 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');

    const filename = `timesheet_${formatDate(new Date()).replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// Display Functions
function displayRecords() {
    const tbody = document.getElementById('recordsBody');
    tbody.innerHTML = '';

    records.forEach((record, index) => {
        const row = tbody.insertRow();
        const statusClass = getStatusClass(record.status);
        const duration = calculateDuration(record.startTime, record.endTime);
        row.className = 'hover:bg-gray-50 transition-colors';
        row.innerHTML = `
            <td class="px-4 py-3 text-sm">${record.date}</td>
            <td class="px-4 py-3 text-sm">${index + 1}</td>
            <td class="px-4 py-3 text-sm">${record.project}</td>
            <td class="px-4 py-3 text-sm">${record.category}</td>
            <td class="px-4 py-3 text-sm">${record.taskType}</td>
            <td class="px-4 py-3 text-sm">${record.role}</td>
            <td class="px-4 py-3 text-sm">${record.workname}</td>
            <td class="px-4 py-3 text-sm">${record.startTime}</td>
            <td class="px-4 py-3 text-sm">${record.endTime}</td>
            <td class="px-4 py-3 text-sm font-semibold">${duration}</td>
            <td class="px-4 py-3 text-sm"><span class="${statusClass}">${record.status}</span></td>
            <td class="px-4 py-3 text-sm">${record.remark}</td>
            <td class="px-4 py-3 text-sm">
                <div class="flex gap-2">
                    <button onclick="editRecord(${index})" 
                            class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-xs">
                        Edit
                    </button>
                    <button onclick="deleteRecord(${index})" 
                            class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-xs">
                        Delete
                    </button>
                </div>
            </td>
        `;
    });
}

function getStatusClass(status) {
    const baseClass = 'px-3 py-1 rounded-full text-xs font-semibold inline-block';
    switch (status.toLowerCase()) {
        case 'completed':
            return `${baseClass} bg-green-100 text-green-800`;
        case 'in progress':
            return `${baseClass} bg-yellow-100 text-yellow-800`;
        case 'pending':
            return `${baseClass} bg-red-100 text-red-800`;
        default:
            return `${baseClass} bg-gray-100 text-gray-800`;
    }
}

// Utility Functions
function calculateDuration(startTime, endTime) {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    let diff = end - start;
    
    // Handle cases where end time is on the next day
    if (diff < 0) {
        diff += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
    }

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    return `${hours}h ${minutes}m`;
}

function validateForm() {
    return document.getElementById('project').value &&
        document.getElementById('category').value &&
        document.getElementById('taskType').value &&
        document.getElementById('role').value &&
        document.getElementById('workname').value;
}

function disableFormInputs(disable) {
    document.getElementById('project').disabled = disable;
    document.getElementById('category').disabled = disable;
    document.getElementById('taskType').disabled = disable;
    document.getElementById('role').disabled = disable;
    document.getElementById('workname').disabled = disable;
    document.getElementById('remark').disabled = disable;
}

function deleteRecord(index) {
    if (confirm('Are you sure you want to delete this record?')) {
        records.splice(index, 1);
        saveRecords();
        displayRecords();
        showNotification('Record deleted successfully!');
    }
}

function clearAllRecords() {
    if (confirm('Are you sure you want to clear all records? This cannot be undone!')) {
        records = [];
        saveRecords();
        displayRecords();
        showNotification('All records cleared!');
    }
}

function saveRecords() {
    localStorage.setItem('timesheetRecords', JSON.stringify(records));
}

function loadRecords() {
    const saved = localStorage.getItem('timesheetRecords');
    if (saved) {
        records = JSON.parse(saved);
    }
}

function formatDate(date) {
    const d = new Date(date);
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatTime(date) {
    const d = new Date(date);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

function loadRunningTask() {
    const saved = localStorage.getItem('runningTask');
    if (saved) {
        runningTask = JSON.parse(saved);

        document.getElementById('project').value = runningTask.project;
        document.getElementById('category').value = runningTask.category;
        document.getElementById('taskType').value = runningTask.taskType;
        document.getElementById('role').value = runningTask.role;
        document.getElementById('workname').value = runningTask.workname;
        document.getElementById('remark').value = runningTask.remark;

        startTime = new Date(runningTask.startTime);
        document.getElementById('startTimeDisplay').textContent = formatTime(startTime);
        document.getElementById('endTimeDisplay').textContent = '--:--:--';

        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        disableFormInputs(true);

        const elapsed = new Date() - startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);

        showNotification(`Timer Resumed! Task: ${runningTask.workname}, Elapsed: ${hours}h ${minutes}m`);

        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-5 right-5 bg-gradient-to-r from-green-500 to-green-600 text-white p-5 rounded-lg shadow-2xl z-50 max-w-sm animate-fade-in-down';
    notification.innerHTML = `<strong>⏰ ${message}</strong>`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Modal Events
window.onclick = function (event) {
    if (event.target == document.getElementById('statusModal')) {
        cancelStop();
    }
    if (event.target == document.getElementById('editModal')) {
        closeEditModal();
    }
}