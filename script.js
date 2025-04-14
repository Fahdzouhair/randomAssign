document.addEventListener('DOMContentLoaded', function() {
    // --- Get Elements ---
    const namesInput = document.getElementById('namesInput');
    const optionsInput = document.getElementById('optionsInput');
    const assignButton = document.getElementById('assignButton');
    const animationArea = document.getElementById('animationArea');
    const placeholderText = animationArea.querySelector('.placeholder-text');

    const resultsModal = document.getElementById('resultsModal');
    const resultList = document.getElementById('resultList');
    const closeModalButton = document.getElementById('closeModalButton');

    // --- State ---
    let currentNames = [];
    let currentOptions = [];
    let assignments = [];
    let isAnimating = false;

    // --- Event Listeners ---
    assignButton.addEventListener('click', handleAssignment);
    closeModalButton.addEventListener('click', hideModal);
    resultsModal.addEventListener('click', (e) => {
        // Close modal if overlay is clicked
        if (e.target === resultsModal) {
            hideModal();
        }
    });

    // --- Functions ---

    function handleAssignment() {
        if (isAnimating) return;

        // 1. Get and Validate Inputs
        currentNames = namesInput.value.split(',')
            .map(n => n.trim()).filter(n => n);
        currentOptions = optionsInput.value.split(',')
            .map(o => o.trim()).filter(o => o);

        if (currentNames.length === 0 || currentOptions.length === 0) {
            alert('Please enter at least one name and one option.');
            return;
        }
         if (currentNames.length > currentOptions.length) {
             alert('Please provide at least as many options as names.');
             return;
         }

        isAnimating = true;
        assignButton.disabled = true;
        assignButton.textContent = 'Assigning...';
        if (placeholderText) placeholderText.style.display = 'none';

        // 2. Perform Assignment (with hidden Saif rule)
        assignments = assignOptionsLogic(currentNames, currentOptions);

        // 3. Setup and Run Animation
        setupAnimationElements(assignments);
        runAnimations(assignments);

        // 4. Show Results (after animation)
        // Use setTimeout matching the animation duration + delay
        const animationDuration = 1000; // ms (matches CSS transition)
        const maxDelay = 500; // ms (rough estimate of stagger)
        setTimeout(() => {
            displayResults(assignments);
            isAnimating = false;
            assignButton.disabled = false;
            assignButton.textContent = 'Assign & Animate';
        }, animationDuration + maxDelay + 100); // Add buffer
    }

    function assignOptionsLogic(names, options) {
        let nameList = [...names];
        let optionList = [...options];
        let assigned = [];
        let finalAssignments = {}; // Use object for easy lookup: { name: option }

        // ** Hidden Saif Rule **
        const saifIndex = nameList.findIndex(name => name.toLowerCase() === 'saif');
        let saifOption = null;

        if (saifIndex !== -1 && optionList.length > 0) {
            saifOption = optionList.splice(0, 1)[0]; // Take first option
            const saifName = nameList.splice(saifIndex, 1)[0]; // Remove Saif from list
            finalAssignments[saifName] = saifOption;
            assigned.push({ name: saifName, option: saifOption });
        }

        // Shuffle remaining names and options
        shuffleArray(nameList);
        shuffleArray(optionList);

        // Assign remaining
        nameList.forEach((name, index) => {
            if (optionList[index]) { // Ensure there's an option left
                finalAssignments[name] = optionList[index];
                assigned.push({ name: name, option: optionList[index] });
            }
             // If fewer options than names remain (after Saif), some names won't get assigned
             // Logic adjusted based on alert check ensuring options >= names initially
        });

        // Return both the list and the lookup object
        return { list: assigned, lookup: finalAssignments };
    }

    function setupAnimationElements(assignmentData) {
        animationArea.innerHTML = ''; // Clear previous elements

        const nameElements = {};
        const optionElements = {};

        const areaRect = animationArea.getBoundingClientRect();
        const availableWidth = areaRect.width - 150; // Subtract padding/margins
        const availableHeight = areaRect.height - 100;

        // Create unique options list based on assignments
        const uniqueOptions = [...new Set(assignmentData.list.map(a => a.option))];

        // Create and position Option Targets
        uniqueOptions.forEach((option, index) => {
            const target = document.createElement('div');
            target.className = 'option-target';
            target.textContent = option;

            // Position targets (e.g., along the bottom or right edge)
            const posX = (availableWidth / (uniqueOptions.length + 1)) * (index + 1);
            const posY = availableHeight; // Position along bottom
            target.style.left = `${posX}px`;
            target.style.top = `${posY}px`;
            // Add transform for centering if needed based on target size
            target.style.transform = 'translateX(-50%)';

            animationArea.appendChild(target);
            optionElements[option] = target; // Store ref

             // Trigger fade-in
             requestAnimationFrame(() => {
                 target.style.opacity = '1';
             });
        });

        // Create and position Name Cards initially (e.g., top or left edge)
        assignmentData.list.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'name-card';
            card.textContent = item.name;

            // Initial position (e.g., scattered near top-left)
             const initialX = 20 + (Math.random() * 50) ;
             const initialY = 20 + index * 15; // Stagger vertically slightly
            card.style.left = `${initialX}px`;
            card.style.top = `${initialY}px`;

            animationArea.appendChild(card);
            nameElements[item.name] = card; // Store ref

            // Trigger fade-in
            requestAnimationFrame(() => {
                card.style.opacity = '1';
            });
        });

        // Store elements for animation function
        animationArea.dataset.elements = JSON.stringify({ nameElements, optionElements });
    }

     function runAnimations(assignmentData) {
        const nameElements = Array.from(animationArea.querySelectorAll('.name-card'));
        const optionElements = {};
         Array.from(animationArea.querySelectorAll('.option-target')).forEach(el => {
             optionElements[el.textContent] = el;
         });

        assignmentData.list.forEach((item, index) => {
            const nameCard = nameElements.find(el => el.textContent === item.name);
            const optionTarget = optionElements[item.option];

            if (nameCard && optionTarget) {
                const targetRect = optionTarget.getBoundingClientRect();
                const cardRect = nameCard.getBoundingClientRect();
                const areaRect = animationArea.getBoundingClientRect();

                // Calculate target position relative to animationArea
                // Aim for slightly above the target center
                const targetX = (targetRect.left - areaRect.left) + (targetRect.width / 2) - (cardRect.width / 2) ;
                const targetY = (targetRect.top - areaRect.top) - cardRect.height - 10; // 10px above

                // Apply staggered delay
                 const delay = index * 100; // 100ms stagger

                // Apply transform via style property with transition
                 nameCard.style.transition = `transform ${1000}ms cubic-bezier(0.68, -0.55, 0.27, 1.55) ${delay}ms, opacity 0.5s ease ${delay}ms`;
                 nameCard.style.transform = `translate(${targetX - parseFloat(nameCard.style.left)}px, ${targetY - parseFloat(nameCard.style.top)}px)`;
            }
        });
    }


    function displayResults(assignmentData) {
        resultList.innerHTML = ''; // Clear previous results
        assignmentData.list.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="result-name">${item.name}</span>
                <span class="result-arrow">➔</span>
                <span class="result-option">${item.option}</span>
            `;
            // ** No special highlighting for Saif **
            resultList.appendChild(li);
        });
        showModal();
    }

    function showModal() {
        resultsModal.style.display = 'flex'; // Use flex to enable centering
        requestAnimationFrame(() => { // Ensure display is set before transitioning opacity
            resultsModal.classList.add('visible');
        });
    }

    function hideModal() {
        resultsModal.classList.remove('visible');
        // Wait for transition before setting display none
        resultsModal.addEventListener('transitionend', () => {
            resultsModal.style.display = 'none';
        }, { once: true }); // Remove listener after it runs once
    }

    // Fisher-Yates Shuffle
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

}); // End DOMContentLoaded