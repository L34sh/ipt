// Handle profile form submission
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                contactNumber: document.getElementById('contactNumber').value,
                currentPassword: document.getElementById('currentPassword').value,
                newPassword: document.getElementById('newPassword').value,
                confirmPassword: document.getElementById('confirmPassword').value
            };

            try {
                const response = await fetch('/api/member/profile/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                
                if (data.success) {
                    alert('Profile updated successfully!');
                    // Refresh the page to show updated data
                    window.location.reload();
                } else {
                    alert(data.message || 'Error updating profile');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while updating profile');
            }
        });
    }
});

// Load attendance data
async function loadAttendanceData() {
    const attendanceTableBody = document.getElementById('attendanceTableBody');
    if (attendanceTableBody) {
        try {
            const response = await fetch('/api/member/attendance');
            const data = await response.json();
            
            if (data.success) {
                attendanceTableBody.innerHTML = data.attendance.map(record => `
                    <tr>
                        <td>${new Date(record.date).toLocaleDateString()}</td>
                        <td>${record.checkIn || 'N/A'}</td>
                        <td>${record.checkOut || 'N/A'}</td>
                        <td>${record.duration || 'N/A'}</td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
        }
    }
}

// Load membership data
async function loadMembershipData() {
    const membershipTableBody = document.getElementById('membershipTableBody');
    if (membershipTableBody) {
        try {
            const response = await fetch('/api/member/membership');
            const data = await response.json();
            
            if (data.success) {
                // Update membership status
                if (data.membership) {
                    document.getElementById('membershipType').textContent = data.membership.type;
                    document.getElementById('expiryDate').textContent = new Date(data.membership.expiryDate).toLocaleDateString();
                    document.getElementById('membershipStatus').textContent = data.membership.status;
                }
            }
        } catch (error) {
            console.error('Error loading membership:', error);
        }
    }
}

// Initialize data loading
document.addEventListener('DOMContentLoaded', function() {
    loadAttendanceData();
    loadMembershipData();
});
