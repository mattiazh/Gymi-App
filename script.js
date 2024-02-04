var current_index = 0;
var quizData = [];
var reviewList = []; // Single review list for questions not yet answered correctly
var answeredQuestions = [];
var answeredCorrectly = [];
var firstTry = true;
var totalQuestionsInRound;
var answeredCorrectlyCount = 0;
var attemptedQuestionsCount = 0;
var isCorrectionPhase = false;
var quizStats = {
    correctAnswers: 0,
    totalQuestions: 0,
    incorrectAnswers: 0,
    totalTime: 0,
    startTime: 0,
    currentQuestionAttempts: 0,
    totalAttempts: 0
};

window.onload = init;

function init() {
    loadData();
    document.getElementById('startScreen').style.display = 'block';
    document.getElementById('quizContainer').style.display = 'none';
    initCanvas();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadData() {
    console.log('Loading data...');
    fetch('./quiz_data.json')
        .then(response => response.json())
        .then(data => {
            quizData = data;
            shuffleArray(quizData); // Shuffle the questions
            reviewList = quizData.map((_, index) => index); // Initialize the review list with all question indices
        })
        .catch(error => {
            console.error("Error loading JSON file:", error);
        });
}

function startQuiz(category) {
    console.log('Starting quiz with category:', category);
    document.getElementById('startScreen').style.display = 'none';
    quizData = quizData.filter(item => getCategoryForType(item.type) === category);
    reviewList = quizData.map((_, index) => index); // Reset the reviewList with indexes for the filtered quizData
    current_index = reviewList[0]; // Start with the first question in the reviewList
    document.getElementById('quizContainer').style.display = 'block';
    totalQuestionsInRound = reviewList.length;
    answeredCorrectlyCount = 0;
    attemptedQuestionsCount = 1;
    displayQuestion();
    updateProgressBar();
}

function getCategoryForType(taskType) {
    switch (taskType) {
        case "multiple_choice":
        case "text_input":
            return "Synonym Aufgaben";
        case "verb_form":
        case "verb_recognition":
            return "Verb Aufgaben";
        case "adjective_form":
            return "Adjektiv Aufgaben";
        case "addition_subtraction_equations":
        case "addition_subtraction_calculations":
            return "Additons und Subtraktions Aufgaben";
        case "text_exercises_1":
        case "text_exercises_2":
        case "text_exercises_3":
        case "text_exercises_4":
        case "text_exercises_5":
        case "text_exercises_6":
            return "Text Aufgaben"
        default:
            return "";
    }
}

function displayQuestion() {
    if (reviewList.length === 0) {
        console.log("Quiz finished!");
        console.log("No more questions to display.");
        return;
    }
    current_index = reviewList[0];
    console.log(`Displaying Question: Index ${current_index}`);
    let currentItem = quizData[current_index];
    if (!currentItem || !currentItem.type) {
        console.error("Invalid question data:", currentItem);
        return;
    }
    let questionEl = document.getElementById('question');
    let optionsEl = document.getElementById('options');
    let instructionEl = document.getElementById('instruction');
    let feedbackEl = document.getElementById('feedback');
    let titleEl = document.querySelector('.quiz-title');
    let taskNumberEl = document.getElementById('taskNumber');
    let progressFillEl = document.querySelector('.progress-fill');
    quizStats.startTime = Date.now();
    let customDuration = 60; // Default duration in seconds (1 minute)
    if (currentItem.type.includes("text_exercises") || currentItem.type.includes("addition_subtraction")) {
        customDuration = 420; // 7 minutes in seconds for text exercises and addition/subtraction tasks
    }

    // Show or dont show the note area
    let noteField = document.getElementById('noteField');

    if (currentItem.type === "text_exercises_1" || currentItem.type === "addition_subtraction_calculations" || currentItem.type === "addition_subtraction_equations" || currentItem.type === "text_exercises_2" || currentItem.type === "text_exercises_3" || currentItem.type === "text_exercises_4" || currentItem.type === "text_exercises_5" || currentItem.type === "text_exercises_6") {
        noteField.style.display = 'block'; // Show the note field
    } else {
        noteField.style.display = 'none'; // Hide the note field
    }

    // Set the title based on the correction phase
    let categoryTitle = getCategoryForType(currentItem.type);
    if (isCorrectionPhase) {
        categoryTitle = "Korrektur: " + categoryTitle;
    }
    titleEl.textContent = categoryTitle;
    

    // Reset feedback and options style
    feedbackEl.textContent = "";
    document.getElementById('solution').innerHTML = "";
    const selectedOptions = document.querySelectorAll('.option-label');
    selectedOptions.forEach(option => {
        option.style.borderColor = "";
    });


    // Show or hide correctButton based on question type
    const nextButton = document.querySelector('.btn-next');
    const isLastQuestion = reviewList.length === 1;
    const noMoreQuestions = isLastQuestion && (isCorrectionPhase || answeredCorrectly.length === quizData.length);
    if (noMoreQuestions) {
        nextButton.textContent = 'Quiz beenden';
    } else {
        nextButton.textContent = 'Nächste Frage';
    }
    correctButton.style.display = currentItem.type === "multiple_choice" ? "none" : "block";
    document.querySelector('.btn-next').style.display = 'none';

    // Set the title and question content
    titleEl.textContent = categoryTitle;
    questionEl.innerHTML = currentItem.question ? currentItem.question.replace(/\/(.*?)\//g, '<strong>$1</strong>') : "";
    instructionEl.innerHTML = currentItem.instruction ? currentItem.instruction.replace(/\/(.*?)\//g, '<strong>$1</strong>') : "";

    // Update the progress bar and task number display based on the round system
    let currentTaskNumber = attemptedQuestionsCount; // Increment here for display purpose
    let progressPercentage = (currentTaskNumber / totalQuestionsInRound) * 100;

    taskNumberEl.textContent = `${currentTaskNumber}/${totalQuestionsInRound}`;
    progressFillEl.style.width = `${progressPercentage}%`;

    // Start the timer with the custom duration
    let display = document.querySelector('.timer-text');
    startTimer(customDuration, display);

    optionsEl.innerHTML = ''; 

    switch (currentItem.type) {
        case "multiple_choice":
            let options = currentItem.options.map((option, index) => {
                let isCorrect = option.includes('?');
                let displayOption = option.replace(/\?/g, '');
                return `<label class="option-label" for="option${index}">
                           <input type="radio" id="option${index}" name="option" value="${isCorrect}">
                           <span class="option-text">${displayOption}</span>
                        </label><br>`;
            }).join('');                        
            optionsEl.innerHTML = options;

            const radioButtons = document.querySelectorAll(".option-label input[type='radio']"); // Hinzufügen der Event Listener für die Radio-Buttons
            radioButtons.forEach(radio => {
                radio.addEventListener("change", checkAnswer);
            });
            break;        
        case "text_input":
            optionsEl.innerHTML = '<input type="text" id="textInput" placeholder="Geben Sie Ihre Antwort ein">';
            break;
        case "verb_form":
            let verbHtml = `${currentItem.verb}<br>`;
            currentItem.forms.forEach((form, index) => {
                verbHtml += `<label>${form}: <input type="text" id="verbForm${index}"></label><br>`;
            });
            optionsEl.innerHTML = verbHtml;
            break;
        case "adjective_form":
            let adjHtml = `${currentItem.adjective}<br>`;
            currentItem.grades.forEach((grade, index) => {
                adjHtml += `<label>${grade}: <input type="text" id="adjForm${index}" placeholder="${grade} hier eingeben"></label><br>`;
            });
            optionsEl.innerHTML = adjHtml;
            break;
        case "verb_recognition":
            let verbRecognitionHtml = `
                <label>Person: <input type="text" id="personInput" placeholder="z.B. 3. Person"></label>
                <label>Numerus: <input type="text" id="numerusInput" placeholder="z.B. Singular"></label>
                <label>Zeitform: <input type="text" id="tenseInput" placeholder="z.B. Präsens"></label>
            `;
            optionsEl.innerHTML = verbRecognitionHtml;
            break;
        case "addition_subtraction_calculations":
                questionEl.innerHTML = currentItem.calculation;
                optionsEl.innerHTML = '<input type="text" id="calculationInput" placeholder="Gib deine Antwort ein">';
                break;
        case "addition_subtraction_equations":
            questionEl.innerHTML = `<p>${currentItem.equation}</p>`;
            optionsEl.innerHTML = '<input type="text" id="equationInput" placeholder= "Deine Antwort für x">';
            break;
        case "text_exercises_1":
            // Split the question into parts if it contains 'a)', 'b)', etc.
            const questionParts = currentItem.question.split(/ a\) | b\) /);
            let contentHTML = '';

            questionParts.forEach((part, index) => {
                if (index === 0) {
                    // Add the main part of the question
                    contentHTML += `<p>${part}</p>`;
                } else {
                    // For each subsequent part, add the question text and an input field
                    contentHTML += `<p>${index}) ${part}</p>`;
                    contentHTML += `<input type="text" id="solutionInput${index-1}" placeholder="Antwort für ${index})" class="solution-input"><br>`;
                }
        
            });

        case "text_exercises_2":
            // Initialize contentHTML at the beginning of the case
            let contentHTML2 = '';
            const questionParts2 = currentItem.question.split(/ a\) | b\) | c\) /);

            questionParts2.forEach((part, index) => {
                if (index === 0) {
                    contentHTML2 += `<p>${part}</p>`;
                } else {
                    contentHTML2 += `<p>${index}) ${part}</p>`;
                    contentHTML2 += `<input type="text" id="solutionInput${index-1}" placeholder="Antwort für ${index})" class="solution-input"><br>`;
                }
            });

            questionEl.innerHTML = contentHTML2;
            break;
        case "text_exercises_3":
            questionEl.innerHTML = `<p>${currentItem.question}</p>`;
            optionsEl.innerHTML = '<input type="text" id="solutionInput3" placeholder="Gib deine Antwort ein" class="solution-input">';
            break;
        case "text_exercises_4":
            questionEl.innerHTML = `<p>${currentItem.question}</p>`;
            optionsEl.innerHTML = '<input type="text" id="solutionInput4" placeholder="Gib deine Antwort ein" class="solution-input">';
            break;
        case "text_exercises_5":
            questionEl.innerHTML = currentItem.question;
            optionsEl.innerHTML = '<input type="text" id="textInput" placeholder="Gib das Resultat in km/h an">';
            break;
        case "text_exercises_6":
            questionEl.innerHTML = currentItem.question;
            optionsEl.innerHTML = '<input type="text" id="textInput" placeholder="Gib die Anzahl Liter an">';
            break;
    }
            
    // Hide the 'correct' button and show the 'next' button
    document.getElementById('correctButton').style.display = 'block';
    document.querySelector('.btn-next').style.display = 'none';
}


function checkAnswer() {
    if (!quizData[current_index]) return;
    let currentItem = quizData[current_index];
    let feedbackEl = document.getElementById('feedback');
    let isAnswerCorrect = false;
    let timeTaken = Date.now() - quizStats.startTime;
    quizStats.totalTime += timeTaken;
    quizStats.currentQuestionAttempts++;


    if (currentItem.type === "multiple_choice") {
        const selectedOption = document.querySelector('input[name="option"]:checked');
        const selectedLabel = selectedOption.closest('.option-label');
        selectedLabel.style.borderColor = "black"; // Setzt die Umrandung sofort auf Schwarz

        // Markiere die richtige Antwort grün
        const correctOption = document.querySelector('input[name="option"][value="true"]');
        const correctLabel = correctOption.closest('.option-label');
        
        setTimeout(() => {
            if (selectedOption && selectedOption.value === "true" && firstTry) {
                selectedLabel.style.borderColor = "green";
                isAnswerCorrect = true;
            } else {
                selectedLabel.style.borderColor = "red";
                correctLabel.style.borderColor = "green";
                isAnswerCorrect = false;
                if (selectedOption && selectedOption.value !== "true") {
                    firstTry = false;   // Benutzer hat im ersten Versuch die falsche Antwort gewählt
                }
            } 
        }, 500);


    } if (currentItem.type === "text_input") {
        const userInput = document.getElementById('textInput').value.trim();
        if (currentItem.answers.includes(userInput)) {
            feedbackEl.textContent = "Richtig!";
            feedbackEl.style.color = "green";
            isAnswerCorrect = true;
        } else {
            feedbackEl.textContent = "Falsch!";
            feedbackEl.style.color = "red";
            isAnswerCorrect = false;
            
        }
    } if (currentItem.type === "verb_form") {
        let correct = true;
        for (let i = 0; i < currentItem.answers.length; i++) {
            const userInput = document.getElementById(`verbForm${i}`).value.trim();
            if (!userInput || !currentItem.answers[i].includes(userInput)) {  // Überprüfen, ob die Eingabe leer ist oder nicht zu den Antworten gehört
                correct = false;
                break;
            }
        }
        if (correct) {
            feedbackEl.textContent = "Richtig!";
            feedbackEl.style.color = "green";
            isAnswerCorrect = true;
        } else {
            feedbackEl.textContent = "Falsch!";
            feedbackEl.style.color = "red";
            isAnswerCorrect = false;
        }
    }

    if (currentItem.type === "adjective_form") {
        let correct = true;
        for (let i = 0; i < currentItem.grades.length; i++) {
            const userInput = document.getElementById(`adjForm${i}`).value.trim();
            console.log("Current Index:", i);
            if (!currentItem.forms[i].includes(userInput)) {
                correct = false;
                break;
            }
        }
        if (correct) {
            feedbackEl.textContent = "Richtig!";
            feedbackEl.style.color = "green";
            isAnswerCorrect = true;
        } else {
            feedbackEl.textContent = "Falsch!";
            feedbackEl.style.color = "red";
            isAnswerCorrect = false;
        }
    }    

    if (currentItem.type === "verb_recognition") {
        const personInput = document.getElementById('personInput').value.trim() || "";
        const numerusInput = document.getElementById('numerusInput').value.trim() || "";
        const tenseInput = document.getElementById('tenseInput').value.trim() || "";

        if (currentItem.answers[0] && currentItem.answers[1] &&
            currentItem.answers[0].toLowerCase() === personInput.toLowerCase() && 
            currentItem.answers[1].toLowerCase() === (numerusInput + " " + tenseInput).toLowerCase()) {
    
            feedbackEl.textContent = "Richtig!";
            feedbackEl.style.color = "green";
            isAnswerCorrect = true;
        } else {
            feedbackEl.textContent = "Falsch!";
            feedbackEl.style.color = "red";
            isAnswerCorrect = false;
        }
    }

    if (currentItem.type === "addition_subtraction_calculations") {
            userAnswer = document.getElementById('calculationInput').value.trim();
            if (userAnswer === currentItem.solution.toString()) {
                feedbackEl.textContent = "Richtig!";
                feedbackEl.style.color = "green";
                isAnswerCorrect = true;
            } else {
                feedbackEl.textContent = "Falsch!";
                feedbackEl.style.color = "red";
                isAnswerCorrect = false;
            }
    }

    if (currentItem.type === "addition_subtraction_equations") {
            userAnswer = document.getElementById('equationInput').value.trim();
            if (userAnswer === currentItem.solution.toString()) {
                feedbackEl.textContent = "Richtig!";
                feedbackEl.style.color = "green";
                isAnswerCorrect = true;
            } else {
                feedbackEl.textContent = "Falsch!";
                feedbackEl.style.color = "red";
                isAnswerCorrect = false;
            }
     }


    if (currentItem.type === "text_exercises_1") {
        const solutionParts = currentItem.solution.split(", ");
        let isAnswerCorrect = true;  // Initialize as true
    
        solutionParts.forEach((part, index) => {
            const inputElement = document.getElementById(`solutionInput${index}`);
            if (inputElement) {
                const userAnswer = inputElement.value.trim();
                const numericUserAnswer = parseFloat(userAnswer);
                const numericPart = parseFloat(part);
    
                if (numericUserAnswer !== numericPart) {
                    isAnswerCorrect = false;
                }
            } else {
                console.error(`Input field solutionInput${index} not found.`);
                isAnswerCorrect = false; // Consider the answer incorrect if the input field is not found
            }
        });
    
        if (isAnswerCorrect) {
            feedbackEl.textContent = "Richtig!";
            feedbackEl.style.color = "green";
        } else {
            feedbackEl.textContent = "Falsch!";
            feedbackEl.style.color = "red";
        }
    }

    if (currentItem.type === "text_exercises_2") {
        const solutionParts = currentItem.solution.split(", ");
        let isAnswerCorrect = true;

        solutionParts.forEach((part, index) => {
            const inputElement = document.getElementById(`solutionInput${index}`);
            if (inputElement) {
                const userAnswer = inputElement.value.trim();
                if (userAnswer !== part) {
                    isAnswerCorrect = false;
                }
            } else {
                console.error(`Input field solutionInput${index} not found.`);
                isAnswerCorrect = false; // Consider the answer incorrect if the input field is not found
            }
        });

        if (isAnswerCorrect) {
            feedbackEl.textContent = "Richtig!";
            feedbackEl.style.color = "green";
        } else {
            feedbackEl.textContent = "Falsch!";
            feedbackEl.style.color = "red";
        }
    }

    if (currentItem.type === "text_exercises_3") {
        const userAnswer = document.getElementById('solutionInput3').value.trim();
        if (userAnswer === currentItem.solution) {
            feedbackEl.textContent = "Richtig!";
            feedbackEl.style.color = "green";
            isAnswerCorrect = true;
        } else {
            feedbackEl.textContent = "Falsch!";
            feedbackEl.style.color = "red";
            isAnswerCorrect = false;
        }
    }

    if (currentItem.type === "text_exercises_4") {
        const userAnswer = document.getElementById('solutionInput4').value.trim();
        if (userAnswer === currentItem.solution) {
            feedbackEl.textContent = "Richtig!";
            feedbackEl.style.color = "green";
            isAnswerCorrect = true;
        } else {
            feedbackEl.textContent = "Falsch!";
            feedbackEl.style.color = "red";
            isAnswerCorrect = false;
        }
    }

    if (currentItem.type === "text_exercises_5") {
        const userAnswer = document.getElementById('textInput').value.trim();
        if (userAnswer === currentItem.solution) {
            feedbackEl.textContent = "Richtig!";
            feedbackEl.style.color = "green";
            isAnswerCorrect = true;
        } else {
            feedbackEl.textContent = "Falsch!";
            feedbackEl.style.color = "red";
            isAnswerCorrect = false;
        }
    }

    if (currentItem.type === "text_exercises_6") {
        const userAnswer = document.getElementById('textInput').value.trim();
        // Assuming the solution is a number, parse it to float for comparison
        if (parseFloat(userAnswer) === parseFloat(currentItem.solution)) {
            feedbackEl.textContent = "Richtig!";
            feedbackEl.style.color = "green";
            isAnswerCorrect = true;
        } else {
            feedbackEl.textContent = "Falsch!";
            feedbackEl.style.color = "red";
            isAnswerCorrect = false;
        }
    }

    console.log("Before updating reviewList, current_index:", current_index);
    console.log("reviewList before updating:", reviewList);

    if (isAnswerCorrect) {
        // Remove the current question from reviewList if answered correctly
        reviewList = reviewList.filter(index => index !== current_index);
        // Add to answeredCorrectly if not already there
        if (!answeredCorrectly.includes(current_index)) {
            quizStats.correctAnswers++;
            quizStats.totalAttempts += quizStats.currentQuestionAttempts; // Add attempts to total
            quizStats.currentQuestionAttempts = 0;
            answeredCorrectly.push(current_index);
        }
        console.log(`Question at index ${current_index} answered correctly.`);
    } else {
        console.log(`Question at index ${current_index} answered incorrectly.`);
        quizStats.incorrectAnswers++;
        // Ensure the question stays in the reviewList if answered incorrectly
        if (!reviewList.includes(current_index)) {
            reviewList.push(current_index);
        }    
        firstTry = true; // Reset firstTry for the next question
    }
    quizStats.totalQuestions++;
    console.log(`Current reviewList: ${reviewList}`);

    // Hide the 'correct' button and show the 'next' button
    const nextButton = document.querySelector('.btn-next');
    updateButtonLabel(nextButton);
    document.getElementById('correctButton').style.display = 'none';
    document.querySelector('.btn-next').style.display = 'block';
}

function showAnswer() {
    let timeTaken = Date.now() - quizStats.startTime;
    quizStats.totalTime += timeTaken;
    quizStats.totalAttempts += quizStats.currentQuestionAttempts; // Add attempts to total
    quizStats.currentQuestionAttempts = 0;
    if (!quizData[current_index]) return;

    if (answeredCorrectly.includes(current_index)) {
        // Optionally, provide some feedback or do nothing
        console.log("This question was already answered correctly.");
        return;
    }

    const currentQuestion = quizData[current_index];

    // Check if the current index is already in the reviewList
    if (!reviewList.includes(current_index)) {
        // If it's not in the reviewList, add it to the reviewList
        reviewList.push(current_index);
    }
    
    let answerText = "";

    switch (currentQuestion.type) {
        case "multiple_choice":
            const correctOption = currentQuestion.options.find(option => option.startsWith("?") && option.endsWith("?"));
            answerText = `Die richtige Option wäre <strong>${correctOption.replace(/\?/g, '')}</strong> gewesen.`;
            break;

        case "text_input":
            answerText = `Richtige Synonyme wären <strong>${currentQuestion.answers.join(', ')}</strong> gewesen.`;
            break;

        case "verb_form":
            const verb = currentQuestion.verb;
            answerText = `Die Lösung wäre für <strong>${verb}</strong>:\n`;
            currentQuestion.forms.forEach((form, index) => {
            answerText += `${form}: <strong>${currentQuestion.answers[index].replace("/", " oder ")}</strong> gewesen<br>`;
            });
            break;

        case "adjective_form":
            const adjective = currentQuestion.adjective;
            answerText = `Die Lösung wäre für <strong>${adjective}</strong>:\n`;
            currentQuestion.grades.forEach((grade, index) => {
            answerText += `${grade}: <strong>${currentQuestion.forms[index].join(" oder ")}</strong> gewesen<br>`;
            });
            break;

        case "verb_recognition":
            answerText = `Die Lösung für <strong>${currentQuestion.question}</strong> wäre: <strong>${currentQuestion.answers.join(', ')}</strong> gewesen.`;
            break;

        case "addition_subtraction_calculations":
            answerText = `Die richtige Lösung wäre: <strong>${currentQuestion.solution}</strong> gewesen`;
                break;
    
        case "addition_subtraction_equations":
            answerText = `Der richtige Wert für x <strong>${currentQuestion.solution}</strong> gewesen`;
                break;
        
        case "text_exercises_1":
            const solutionParts = currentQuestion.solution.split(", ");
            answerText = solutionParts.map((part, index) => 
                `Die richtige Antwort für ${index + 1}) wäre: <strong>${part}</strong> gewesen`).join('<br>');
            break;

        case "text_exercises_2":
            const solutionParts2 = currentQuestion.solution.split(", ");
            answerText = solutionParts2.map((part, index) => 
                `Die richtige Antwort für ${index + 1}) wäre: <strong>${part}</strong> gewesen`).join('<br>');
            break;
        case "text_exercises_3":
            answerText = `Die richtige wäre: <strong>${currentQuestion.solution}</strong> gewesen`;
            break;
        case "text_exercises_4":
            answerText = `Die richtige wäre: <strong>${currentQuestion.solution}</strong> gewesen`;
            break;
        case "text_exercises_5":
            answerText = `Die richtige Antwort ist: <strong>${currentQuestion.solution}</strong>`;
            break;
        case "text_exercises_6":
            answerText = `Die richtige Antwort ist: <strong>${currentQuestion.solution}</strong> Liter Wasser abgeflossen.`;
            break;
        
            default:
                answerText = "Keine Antwort verfügbar.";
    }

    answeredQuestions.push({
        question: currentQuestion,
        isCorrect: false
    });

    const inputs = document.querySelectorAll('#options input'); // Deaktivieren Sie alle Eingabefelder und Auswahlmöglichkeiten
    inputs.forEach(input => {
    input.disabled = true;
    });

    document.getElementById('solution').innerHTML = answerText; // Setzt den Antworttext im HTML-Bereich #solution
    document.getElementById('correctButton').style.display = 'none';
    document.querySelector('.btn-next').style.display = 'block';
}

function nextQuestion() {
    // Check if the current question was answered correctly or not
    if (answeredCorrectly.includes(current_index)) {
        console.log("Current question was answered correctly, moving to the next.");
    } else {
        console.log("Current question was answered incorrectly, shifting the reviewList.");
        reviewList.shift();
    }

    // Log the state before updating the next question
    console.log("Before setting next question, current_index:", current_index);
    console.log("reviewList before setting next question:", reviewList);

    clearCanvas();

    // Display the next question if there are any left
    if (reviewList.length > 0) {
        current_index = reviewList[0];
        displayQuestion();
    } else {
        console.log("Round finished. Preparing for the next round if any questions are left.");

        // Reset the reviewList for the next round, excluding the correctly answered questions
        reviewList = quizData.map((_, index) => index).filter(index => !answeredCorrectly.includes(index));

        console.log("ReviewList after resetting for the next round:", reviewList);

        // Reset the totalQuestionsInRound and answeredCorrectlyCount for a new round
        totalQuestionsInRound = reviewList.length;
        attemptedQuestionsCount = 0; // Reset the count for the new round
        answeredCorrectlyCount = 0;

        if (reviewList.length > 0) {
            isCorrectionPhase = true;
        }

        // Check if there are still questions left to be answered correctly
        if (reviewList.length > 0) {
            displayQuestion(); // Display the first question of the new round
        } else {
            console.log("Quiz finished!");
            showEndScreen();
        return;
        }
    }

    // Update the count of attempted questions and progress bar after setting up the next question
    attemptedQuestionsCount++;
    updateProgressBar();

    // Delay before moving to the next question
    setTimeout(() => {
        // Check if the reviewList has any questions left
        if (reviewList.length === 0) {
            console.log("Round finished. Preparing for the next round if any questions are left.");
        } else {
            // Set the current index to the next question
            current_index = reviewList[0];
            displayQuestion(current_index);
        }
    }, 1);
}

function updateProgressBar() {
    // Increment attemptedQuestionsCount for display purpose, but don't actually change its value globally
    let displayAttemptedQuestionsCount = attemptedQuestionsCount;
    let progressPercentage = (displayAttemptedQuestionsCount / totalQuestionsInRound) * 100;
    document.querySelector('.progress-fill').style.width = `${progressPercentage}%`;
    console.log(`Progress Bar Update: ${displayAttemptedQuestionsCount}/${totalQuestionsInRound} (${progressPercentage.toFixed(2)}%)`);
}

function updateButtonLabel(nextButton) {
    if (reviewList.length === 0) {
        nextButton.textContent = 'Quiz beenden';
    } else {
        nextButton.textContent = 'Nächste Frage';
    }
}

function showEndScreen() {
    let accuracyRate = quizStats.totalQuestions > 0 ? 
    (quizStats.correctAnswers / quizStats.totalQuestions) * 100 : 0;
    let averageTimePerQuestion = quizStats.totalQuestions > 0 ? 
        (quizStats.totalTime / quizStats.totalQuestions) / 1000 : 0;
    let averageAttemptsPerQuestion = quizStats.totalQuestions > 0 ? 
        (quizStats.totalAttempts / quizStats.totalQuestions) : 0;

    document.getElementById('correctAnswers').textContent = quizStats.correctAnswers;
    document.getElementById('incorrectAnswers').textContent = quizStats.incorrectAnswers;
    document.getElementById('accuracyRate').textContent = accuracyRate.toFixed(2);
    document.getElementById('averageTime').textContent = averageTimePerQuestion.toFixed(2) + ' Sekunden';
    document.getElementById('averageAttempts').textContent = averageAttemptsPerQuestion.toFixed(2);
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('endScreen').style.display = 'block';
}

let timerInterval;  // Globale Variable für den Timer
const timerText = document.querySelector('.timer-text');
const timerPath = document.querySelector('.timer-path');
const fullDashArray = parseInt(getComputedStyle(timerPath).getPropertyValue('stroke-dasharray'));

function resetTimerDisplay(duration, display) {
    const minutes = parseInt(duration / 60, 10);
    const seconds = parseInt(duration % 60, 10);
    display.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    // Reset the visual timer path
    const timerPath = document.querySelector('.timer-path');
    timerPath.style.strokeDasharray = fullDashArray;
    timerPath.style.strokeDashoffset = fullDashArray;
}

function startTimer(duration, display) {
    let timer = duration, minutes, seconds;
    // Set the initial timer text
    resetTimerDisplay(timer, display);

    if(timerInterval) {
        clearInterval(timerInterval);  // Clear any existing timer interval
    }
    timerInterval = setInterval(function () {
        // Calculate minutes and seconds
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);
        display.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        // Update the stroke-dashoffset
        const dashoffset = fullDashArray - (timer / duration) * fullDashArray;
        document.querySelector('.timer-path').style.strokeDashoffset = dashoffset;

        if (--timer < 0) {
            clearInterval(timerInterval);
            checkAnswer(); // Automatically call checkAnswer when the timer runs out
        }
    }, 1000);
}

function restartQuiz() {
    // Hide the end screen and show the start screen
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';

    // Reset global variables
    current_index = 0;
    quizData = [];
    reviewList = [];
    answeredQuestions = [];
    answeredCorrectly = [];
    firstTry = true;
    totalQuestionsInRound = 0;
    answeredCorrectlyCount = 0;
    attemptedQuestionsCount = 0;
    isCorrectionPhase = false;
    quizStats.totalTime = 0;
    quizStats.startTime = 0
    quizStats.totalAttempts = 0;
    quizStats.currentQuestionAttempts = 0;

    document.querySelector('.progress-fill').style.width = '0%';
    document.querySelector('.timer-text').textContent = "05:00";

    // Reload or re-fetch quiz data if necessary
    loadData();
}

let drawingCanvas = document.getElementById('drawingCanvas');
let drawingCtx = drawingCanvas.getContext('2d');
let drawing = false;
let isDrawingMode = true;

function resizeCanvas() {
    drawingCanvas.width = window.innerWidth; // Set canvas width to window width
    drawingCanvas.height = 842; // Set a fixed height or make it dynamic as well
}

function initCanvas() {
    if (!drawingCanvas) {
        console.error("Drawing canvas element not found!");
        return;
    }

    resizeCanvas(); // Resize canvas on initialization

    window.addEventListener('resize', resizeCanvas); // Resize canvas on window resize

    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function startDrawing(e) {
    drawing = true;
    draw(e);
}

function stopDrawing() {
    drawing = false;
    drawingCtx.beginPath();
}

function draw(e) {
    if (!drawing) return; // If not drawing, exit the function
    let mousePos = getMousePos(drawingCanvas, e); // Get the current mouse position

    if (isDrawingMode) {
        // If in drawing mode
        drawingCtx.globalCompositeOperation = 'source-over'; // Normal drawing operation
        drawingCtx.strokeStyle = 'black'; // Color for drawing
    } else {
        // If in erasing mode
        drawingCtx.globalCompositeOperation = 'destination-out'; // Eraser operation
        drawingCtx.strokeStyle = 'rgba(0,0,0,1)'; // The color doesn't matter in this mode
    }

    drawingCtx.lineWidth = isDrawingMode ? 2 : 10; // Line width for drawing or erasing
    drawingCtx.lineCap = 'round'; // Line cap style

    // Drawing or erasing based on the mode
    drawingCtx.lineTo(mousePos.x, mousePos.y); // Draw or erase to the current mouse position
    drawingCtx.stroke(); // Apply the drawing or erasing
    drawingCtx.beginPath(); // Start a new path
    drawingCtx.moveTo(mousePos.x, mousePos.y); // Move to the current mouse position
}

function enableDrawing() {
    isDrawingMode = true;
}

function toggleEraser() {
    isDrawingMode = false;
}

function clearCanvas() {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

initCanvas();


let currentTaskNumber = attemptedQuestionsCount;
let progressPercentage = (currentTaskNumber / totalQuestionsInRound) * 100;
taskNumberEl.textContent = `${currentTaskNumber}/${totalQuestionsInRound}`;
progressFillEl.style.width = `${progressPercentage}%`;

// Starten des Timers mit der angepassten Dauer
let display = document.querySelector('.timer-text');
startTimer(customDuration, display);


