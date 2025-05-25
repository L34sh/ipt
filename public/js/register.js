document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.querySelector('#registrationForm');
    const membershipTypeSelect = document.querySelector('#membershipTypeSelect');
    
    // Fetch membership plans
    async function loadMembershipPlans() {
        try {
            const response = await fetch('/admin/plans/public');
            const plans = await response.json();
            
            // Clear existing options except the first default option
            membershipTypeSelect.innerHTML = '<option value="" selected disabled>Select Membership Type</option>';
            
            // Add new options
            plans.forEach(plan => {
                const option = document.createElement('option');
                option.value = plan.plan_id;
                option.textContent = `${plan.plan_name} - ₱${plan.plan_price}`;
                membershipTypeSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading membership plans:', error);
        }
    }

    // Load plans when page loads
    if (membershipTypeSelect) {
        loadMembershipPlans();
    }

    // Existing registration form handler
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            try {
                // Get form data
                const formData = new FormData(this);
                const registrationData = {
                    first_name: formData.get('first_name'),
                    middle_name: formData.get('middle_name'),
                    last_name: formData.get('last_name'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    contact_number: formData.get('phone'),
                    membership_type: formData.get('membership_type')
                };

                // Client-side validation
                if (!registrationData.email || !registrationData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    throw new Error('Please enter a valid email address');
                }

                if (!registrationData.password || registrationData.password.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }

                if (!registrationData.first_name || !registrationData.last_name) {
                    throw new Error('First and last name are required');
                }

                if (!registrationData.contact_number) {
                    throw new Error('Contact number is required');
                }

                // Submit registration data
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registrationData)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    alert('Registration successful! Please wait for admin approval.');
                    window.location.href = '/login';
                } else {
                    alert(data.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }
});
