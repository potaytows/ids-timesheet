
// Timesheet Tracker Application
let timerInterval = null;
let startTime = null;
let records = [];
let runningTask = null;
let tempEndTime = null;

// Initialize application
window.onload = function () {
    loadRecords();
    displayRecords();
    loadRunningTask();
};

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
}

function updateTimer() {
    if (!startTime) return;

    const now = new Date();
    const diff = now - startTime;

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    document.getElementById('timerDisplay').textContent =
        `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
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

// Form Functions
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

// Display Functions
function displayRecords() {
    const tbody = document.getElementById('recordsBody');
    tbody.innerHTML = '';

    records.forEach((record, index) => {
        const row = tbody.insertRow();
        const statusClass = getStatusClass(record.status);
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
                    <td class="px-4 py-3 text-sm"><span class="${statusClass}">${record.status}</span></td>
                    <td class="px-4 py-3 text-sm">${record.remark}</td>
                    <td class="px-4 py-3 text-sm">
                        <button onclick="deleteRecord(${index})" 
                                class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors">
                            Delete
                        </button>
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

// Data Management Functions
function deleteRecord(index) {
    if (confirm('Are you sure you want to delete this record?')) {
        records.splice(index, 1);
        saveRecords();
        displayRecords();
    }
}

function clearAllRecords() {
    if (confirm('Are you sure you want to clear all records?')) {
        records = [];
        saveRecords();
        displayRecords();
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

// Export Functions
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

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '-');
    };

    const filename = `timesheet_${formatDate(new Date())}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// Utility Functions
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

// Session Restoration
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
    }, 5000);
}

// Modal Events
window.onclick = function (event) {
    if (event.target == document.getElementById('statusModal')) {
        cancelStop();
    }
}