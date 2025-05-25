// Profile Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    const photoForm = document.getElementById('photoForm');
    const securityQuestionsForm = document.getElementById('securityQuestionsForm');
    const setupSecurityBtn = document.getElementById('setupSecurityBtn');
    const changeSecurityBtn = document.getElementById('changeSecurityBtn');
    const saveSecurityQuestionsBtn = document.getElementById('saveSecurityQuestionsBtn');
    const securitySetupIncomplete = document.getElementById('securitySetupIncomplete');
    const securitySetupComplete = document.getElementById('securitySetupComplete');
    const setupSecurityModal = new bootstrap.Modal(document.getElementById('setupSecurityModal'));
    
    // Check if security questions are set up
    fetch('/admin/profile/security-status')
        .then(response => response.json())
        .then(data => {
            if (data.isSetup) {
                setupSecurityBtn.style.display = 'none';
                changeSecurityBtn.style.display = 'inline-block';
                securitySetupIncomplete.style.display = 'none';
                securitySetupComplete.style.display = 'block';
            }
        })
        .catch(console.error);
    
    // Handle profile form submission
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        try {
            // If password fields are filled, validate them
            if (data.newPassword || data.confirmPassword || data.currentPassword) {
                if (data.newPassword !== data.confirmPassword) {
                    document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
                    return;
                }
                if (!data.currentPassword) {
                    document.getElementById('currentPasswordError').textContent = 'Current password is required';
                    return;
                }
            }
            
            const response = await fetch('/admin/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            
            // Show success message
            alert('Profile updated successfully');
            location.reload();
            
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update profile. Please try again.');
        }
    });
    
    // Handle photo form submission
    photoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        try {
            const response = await fetch('/admin/profile/photo', {
                method: 'PUT',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to update photo');
            }
            
            const data = await response.json();
            
            // Update profile photo
            document.querySelector('.profile-container img').src = data.image;
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('changePhotoModal')).hide();
            
            // Show success message
            alert('Profile photo updated successfully');
            
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update profile photo. Please try again.');
        }
    });
    
    // Handle security questions setup
    setupSecurityBtn.addEventListener('click', () => setupSecurityModal.show());
    changeSecurityBtn.addEventListener('click', () => setupSecurityModal.show());
    
    saveSecurityQuestionsBtn.addEventListener('click', async function() {
        const formData = new FormData(securityQuestionsForm);
        const data = Object.fromEntries(formData.entries());
        
        // Validate all fields are filled
        for (let i = 1; i <= 3; i++) {
            if (!data[`question${i}`] || !data[`answer${i}`]) {
                alert('Please fill in all security questions and answers');
                return;
            }
        }
        
        try {
            const response = await fetch('/admin/profile/security-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save security questions');
            }
            
            // Update UI
            setupSecurityBtn.style.display = 'none';
            changeSecurityBtn.style.display = 'inline-block';
            securitySetupIncomplete.style.display = 'none';
            securitySetupComplete.style.display = 'block';
            
            // Close modal
            setupSecurityModal.hide();
            
            // Show success message
            alert('Security questions saved successfully');
            
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to save security questions. Please try again.');
        }
    });
});
