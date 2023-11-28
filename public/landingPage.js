// import { userStatus } from "./js/shared";
import { socket, userTimeZone, userLang, userStatus } from './js/shared.js'


    // Function to get the cookie value by name
    function getCookie(name) {
        const cookieArr = document.cookie.split(';');
        for (const cookie of cookieArr) {
            const [cookieName, cookieValue] = cookie.split('=').map(c => c.trim());
            if (cookieName === name) {
                return cookieValue;
            }
        }
        return null;
    }


    console.log("userStatus from landingPage=", userStatus)
    // <!-- Script to check the cookie on page load and set the checkbox -->
    // Function to check the cookie on page load and set the checkbox
    window.onload = function() {
        const userAgreed = getCookie('userAgreed');
		console.log(userAgreed, "cookie")
        const agreeCheckbox = document.getElementById('agreeCheckbox');

        // Set the checkbox state based on the cookie
        agreeCheckbox.checked = userAgreed === 'true';

        // Add an event listener to the checkbox to handle changes
        agreeCheckbox.addEventListener('change', function() {
            // Update the cookie based on the checkbox state
            document.cookie = 'userAgreed=' + this.checked + '; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';
        });
    };

    
    // let userStatus
    console.log("Check", userStatus)

    document.addEventListener('DOMContentLoaded', function () {
        const loginReqModalButtons = document.querySelectorAll('.loginReqRoute');
        const rulesModalButtons = document.querySelectorAll('.rules')
        const logInModal = document.querySelector('.logInModal');
        const rulesModal = document.getElementById('rulesModal');
        const modals = [logInModal, rulesModal];
        const modalText = document.getElementById('modalLoginText');
        const modalAgreeCheckbox = document.getElementById('modalAgreeCheckbox');
        const rulesModalContinueBtn = document.getElementById('rulesModalContinueBtn');

        let route;
        let originalAnchor;

        rulesModalButtons.forEach(function (anchor) {
            anchor.addEventListener('click', function (event) {
                event.preventDefault();

                route = anchor.href;
                originalAnchor = anchor;
                handleRulesClick(route, originalAnchor);
            });
        });

        loginReqModalButtons.forEach(function (anchor) {
            anchor.addEventListener('click', function (event) {
            event.preventDefault();

            route = anchor.href;
            originalAnchor = anchor;
            // console.log(originalAnchor, "original anchor")
    
            // Check if the user has accepted the rules
            const userAgreedToRules = document.cookie.includes('userAgreed=true');
    
            if (!userAgreedToRules) {
                // Show the rules modal and wait for user agreement
            showModal('rulesModal', route, originalAnchor);
            // console.log(route, originalAnchor,"route and anchor from loginreq ")
            } else if (userStatus !== 'loggedIn') {
            // let action = originalAnchor.getAttribute('data-modal');
    
            // const notLoggedInMessage = 'You need to be logged in to ';
    
            // if (action === 'chatRoom') {
            //     modalText.textContent = notLoggedInMessage + 'enter the Chat Rooms.';
            // } else if (action === 'profile') {
            //     modalText.textContent = notLoggedInMessage + 'to have a Profile.';
            // } else if (action === 'comment') {
            //     modalText.textContent = notLoggedInMessage + 'comment on Posts.';
            // } else if (action === 'noAccess') {
            //     modalText.textContent = 'Guest users do not have access to user Profiles.';
            // } else if (action === 'feed') {
            //     modalText.textContent = notLoggedInMessage + 'to see our Community posts.';
            // } else if (action === 'newPost') {
            //     modalText.textContent = notLoggedInMessage + 'make a new Post.';
            // }
            const action = originalAnchor.getAttribute('data-modal');

            document.getElementById('modalLoginText').textContent = dataModalMessage(action);

            // Show only the login modal if not logged in
            logInModal.style.display = 'block';
            // showModal(logInModal, route, action)

            } else {
            // Redirect if the user is logged in
            window.location.href = originalAnchor.href;
            }
        
            });
        });

        rulesModalContinueBtn.addEventListener('click', function () {
        //    console.log("adding event listener", route, originalAnchor)
            handleRulesModalContinue(route, originalAnchor);
        
        });

        modals.forEach(function (modal) {
             // Close modal when the close button is clicked
            let closeButtons = modal.querySelectorAll('.close, .closebutton');
            closeButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    closeModal(modal);
            });
        });

        // Close modal when clicking outside the modal
        window.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeModal(modal);
            }
            });
        });
        

    });




    // Function to handle link clicks
    function handleRulesClick(route) {
        const agreeCheckbox = document.getElementById('agreeCheckbox');

        // event.preventDefault();

        // Check if the checkbox is checked
        if (agreeCheckbox.checked) {
            // Checkbox is checked, set a cookie to remember the user's agreement
            document.cookie = 'userAgreed=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';
            // Proceed with the route logic
            window.location.href = route;
            // showModal('loginReqModal', route)
        } else {
            // Checkbox is not checked, show the modal
            showModal('rulesModal', route);
        }
    }

    // Function to show the modal
    function showModal(modalId, route, originalAnchor) { 
        // console.log(route, originalAnchor, "checking in showModal");

        const modal = document.getElementById(modalId);

        if (modal !== rulesModal) {
             const action = originalAnchor.getAttribute('data-modal');
        // console.log(modal,action, "modal and action from showmodal")
        // console.log(dataModalMessage(action))
        modal.setAttribute('modalLoginText', action);
        document.getElementById('modalLoginText').textContent = dataModalMessage(action);
        }
       
        // if (modalLoginText) {
        //     modalLoginText.textContent = dataModalMessage(action);
        //     console.log(modal, modalloginText, "from action return")
        // }
        modal.style.display = 'block';
        // modal.setAttribute('data-route', route);
        
    }

    // Function to close the modal
    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Function to handle the modal checkbox
    function handleRulesModalContinue(route, originalAnchor) {
        // console.log(route, originalAnchor, "from the continue ")
        const modalAgreeCheckbox = document.getElementById('modalAgreeCheckbox');

        // Update the variable to track the state of the modal checkbox
        const modalCheckboxChecked = modalAgreeCheckbox.checked;

        if (modalCheckboxChecked) {
            // Set the cookie when the checkbox is checked in the modal
            document.cookie = 'userAgreed=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';

            const agreeCheckbox = document.getElementById('agreeCheckbox');

            // Set the checkbox state based on the cookie
            agreeCheckbox.checked = 'true';

            const rulesModal = document.getElementById('rulesModal');
            // console.log(route, originalAnchor, "route from after contine close modal")

            // Checkbox in the modal is checked, close the modal
            closeModal(rulesModal);


            if (originalAnchor.classList.contains('loginReqRoute')) {
                // console.log(route, originalAnchor, "routesecond  from after contine close modal")
                showModal('loginReqModal', route, originalAnchor);
            } else {
               
                window.location = originalAnchor.href;
            }

            

        } else {
            // Checkbox in the modal is not checked, you can show a message or take appropriate action
            alert('You will need to check the box and agree to the rules before proceeding.');
        }
    };

    function dataModalMessage (action) {
        // let action = originalAnchor.getAttribute('data-modal');
    
            const notLoggedInMessage = 'You need to be logged in to ';
    
            if (action === 'chatRoom') {
                return notLoggedInMessage + 'enter the Chat Rooms.';
            } else if (action === 'profile') {
                return notLoggedInMessage + 'to have a Profile.';
            } else if (action === 'comment') {
                return notLoggedInMessage + 'comment on Posts.';
            } else if (action === 'noAccess') {
                return 'Guest users do not have access to user Profiles.';
            } else if (action === 'feed') {
                return notLoggedInMessage + 'to see our Community posts.';
            } else if (action === 'newPost') {
                return notLoggedInMessage + 'make a new Post.';
            }
            return '';
        
    }