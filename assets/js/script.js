// create web audio api context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// store a custom layout passed in via the URL
let customLayoutFromURL;
let customTitleFromURL;
let parsedLayoutFromURL = [];

// are we on a mobile device?
let mobileDevice = false;
if (navigator.userAgent.toLowerCase().indexOf('mobile') > -1) {
    mobileDevice = true;
}

// keyboards
const keyboardContainer = document.getElementById("keyboard-container");
const keyboard = document.getElementById("keyboard");
const angloContainer = document.getElementById("anglo-container");
const angloKeyboard = document.getElementById("anglo-keyboard");

// chord bar
const chordBar = document.getElementById("chords");
const maj = document.getElementById("major");
const min = document.getElementById("minor");
const dim = document.getElementById("diminished");
const sev = document.getElementById("seventh");
const maj7 = document.getElementById("major7");
const min7 = document.getElementById("minor7");

// user-defined display options
const opt_layout = document.getElementById("layout");
const opt_drone = document.getElementById("drone");
const droneDiv = document.getElementById("drone-option");
const opt_pushpull = document.getElementById("pushpull");
const opt_push = document.getElementById("push");
const opt_pull = document.getElementById("pull");
let opt_bellows = ""; // stores the value of the selected bellows option from pushpull, push, or pull
const multiselect = document.getElementById("multiselect");
const opt_coloroctave = document.getElementById("coloroctave");
const opt_concertinaLabels = document.getElementById("concertina-labels");
const opt_pianoLabels = document.getElementById("piano-labels");
const opt_accidentals = document.getElementById("accidentals");
const opt_absentNotes = document.getElementById("absent-notes");

// the 'about' modal
const aboutLink = document.getElementById("about");
var aboutModal = document.getElementById("about-modal");
var closeModalBtn = document.getElementsByClassName("close")[0];

// an array that contains all currently-displayed concertina buttons
let buttons = [];

// an array to keep track of all currently-displayed piano notes. Required for arrow key navigation.
const activeNotes = [];

// an array to hold the currently selected notes
const selection = [];

// the key that should be selected if the user starts using arrow keys to navigate the piano
let currentIndex = 1;

// are we viewing or editing?
let currentMode;

// anglo keyboard calculates min / max and must be rendered first
function renderPianoKeyboard(min, max, layoutnotes) {
    keyboard.innerHTML = "";
    activeNotes.length = 0;
    let allnotes = Object.keys(notes); // get an array of notes from the note object
    for (let i = min; i < max; i++) {
        let note = allnotes[i];
        let label = note;
        if (opt_accidentals.checked) {
            label = altNoteNames[note];
        }
        if (!opt_pianoLabels.checked) {
            label = "";
        }
        activeNotes.push(note);
        let noteclasses = "natural";
        if (note.includes("#") || note.includes("b")) {
            noteclasses = "sharp";
        }
        noteclasses += ` o${note.substr(-1)}`
        if (opt_absentNotes.checked && !layoutnotes.includes(note)) {
            noteclasses += " absent"
        }
        keyboard.innerHTML += `<button id="${note}" data-note="${note}" class="${noteclasses}">${label}</button>`;
    }
    currentMode = "view";
    bindPianoKeys();
    selectConcertinaButtons();
    selectPianoKey();
}


function renderAngloKeyboard() {
    let layoutnotes = [];
    let allnotes = Object.keys(notes);

    droneDiv.style.display = 'none';
    angloKeyboard.innerHTML = "";
    for (button of buttons) {
        layoutnotes.push(button.push);
        layoutnotes.push(button.pull);
        let pushLabel = button.push;
        let pullLabel = button.pull;
        if (opt_accidentals.checked) {
            pushLabel = altNoteNames[button.push];
            pullLabel = altNoteNames[button.pull];
        }
        if (!opt_concertinaLabels.checked) {
            pushLabel = "&nbsp;"; // for some reason, empty string results in layout issues on non-mac browsers
            pullLabel = "&nbsp;";
        }
        let droneclass = "";
        if (button.drone) {
            droneDiv.style.display = 'block';
            droneclass = "drone";
        }
        if (button.newRow) {
            angloKeyboard.innerHTML += `<br>`;
        }
        angloKeyboard.innerHTML += `<div class="button ${opt_bellows} ${droneclass}" style="margin-left:${button.x}px"><div class="top ${"o" + noteNames[button.push].substr(-1)}"><button data-note="${noteNames[button.push]}">${pushLabel}</button></div><div class="bottom ${"o" + noteNames[button.pull].substr(-1)}"><button data-note="${noteNames[button.pull]}">${pullLabel}</button></div></div>`;
    }
    bindAngloButtons();

    // find the lowest and highest notes for the piano keyboard
    let min = allnotes.indexOf(layoutnotes[0]);
    let max = allnotes.indexOf(layoutnotes[0]);
    for (let i = 1; i < layoutnotes.length; i++) {
        if (allnotes.indexOf(noteNames[layoutnotes[i]]) < min) {
            min = allnotes.indexOf(noteNames[layoutnotes[i]]);
        } else if (allnotes.indexOf(noteNames[layoutnotes[i]]) > max) {
            max = allnotes.indexOf(noteNames[layoutnotes[i]]);
        }
    }
    
    selectDrone();
    colorOctaves();
    renderPianoKeyboard(min, max + 1, layoutnotes);
}



function parseLayout() {
    let layout = customLayoutFromURL;
    let title = customTitleFromURL;
    let newLayout = [];
    while (layout.length > 0) {
        let x = 0;
        let push;
        let pull;
        let newRow = false;
        if (layout[0] == ".") {
            newRow = true;
            layout = layout.slice(1);
        }
        if (layout[0] == "_") {
            x = layout.substring(1, layout.indexOf('_', 1));
            layout = layout.slice(layout.indexOf('_', 1) + 1);
        }
            push = noteCodes[layout[0]];
            pull = noteCodes[layout[1]];
            newLayout.push({ push, pull, x, newRow });
            layout = layout.slice(2);
    }

    parsedLayoutFromURL = newLayout;
    buttons = parsedLayoutFromURL;
    angloKeyboard.innerHTML = "";
    renderAngloKeyboard();
    selectConcertinaButtons();

}


// to render layouts from the old Anglo Piano that assumed a 14-column grid
function parseLegacyLayout() {
    let layout = customLayoutFromURL;
    let newLayout = [];
    let buttonCount = 0;
    while (layout.length > 0) {
        let x;
        let push;
        let pull;
        let newRow = false;
        if (layout[0] == "_") {
            x = layout.substring(1, layout.indexOf('_', 1));
            push = noteCodes[layout.substr(layout.indexOf('_', 1) + 1, 1)];
            pull = noteCodes[layout.substr(layout.indexOf('_', 1) + 2, 1)];
            if (buttonCount % 14 === 0 && buttonCount != 0) {
                newRow = true;
            }
            newLayout.push({ push, pull, x, newRow });
            buttonCount++;
            layout = layout.slice(layout.indexOf('_', 1) + 3);
        } else if (layout[0] == ".") {
            buttonCount++;
            layout = layout.slice(2);
        } else {
            x = 0;
            push = noteCodes[layout[0]];
            pull = noteCodes[layout[1]];
            if (buttonCount % 14 === 0 && buttonCount != 0) {
                newRow = true;
            }
            newLayout.push({ push, pull, x, newRow });
            buttonCount++;
            layout = layout.slice(2);
        }
    }
    parsedLayoutFromURL = newLayout;
    buttons = parsedLayoutFromURL;
    angloKeyboard.innerHTML = "";
    renderAngloKeyboard();
    selectConcertinaButtons();
}


function encodeLayout() {
    let encodedLayout = "";
    for (element of angloKeyboard.children) {
        if (element.nodeName != "BR") {
            if (element.style.marginLeft != "0px") {
                encodedLayout += `_${element.style.marginLeft.replace("px", "")}_`
            }
            for (div of element.children) {
                for (button of div.children) {
                    encodedLayout += encoder[button.dataset.note]
                }
            }
        } else {
            encodedLayout += "~";
        }
    }
    return encodedLayout;
}


function selectPianoKey() {
    for (key of keyboard.children) {
        if (selection.includes(key.dataset.note)) {
            key.classList.add("selected");
            // console.log(key);
        } else {
            key.classList.remove("selected")
        }
    }
}


function selectConcertinaButtons() {
    for (button of angloKeyboard.children) {
        for (div of button.children) {
            for (note of div.children) {
                if (selection.includes(note.dataset.note)) {
                    note.classList.add("selected");
                } else {
                    note.classList.remove("selected");
                }
            }
        }
    }
}

function colorOctaves() {
    if (opt_coloroctave.checked) {
        angloContainer.classList.add("pretty");
        keyboardContainer.classList.add("pretty");
    } else {
        angloContainer.classList.remove("pretty");
        keyboardContainer.classList.remove("pretty");
    }
}

function togglePushView() {
    for (button of angloKeyboard.children) {
        button.classList.remove("pull-only");
        button.classList.add("push-only");
    }
    opt_bellows = "push-only";
}

function togglePullView() {
    for (button of angloKeyboard.children) {
        button.classList.remove("push-only");
        button.classList.add("pull-only");
    }
    opt_bellows = "pull-only";
}

function resetView() {
    for (button of angloKeyboard.children) {
        button.classList.remove("push-only");
        button.classList.remove("pull-only");
    }
    opt_bellows = "";
}

function selectDrone() {
    if (!opt_drone.checked && document.getElementsByClassName("drone")[0]) {
        document.getElementsByClassName("drone")[0].style.visibility = 'hidden';
    } else if (document.getElementsByClassName("drone")[0]) {
        document.getElementsByClassName("drone")[0].style.visibility = 'visible';
    }
}


function updateNoteSelection(note) {
    if (!selection.includes(note) && (multiselect.checked == true || selection.length == 0)) {
        selection.push(note);
    } else if (!selection.includes(note)) {
        selection.length = 0;
        selection.push(note);
    } else {
        selection.splice(selection.indexOf(note), 1);
    }
    selectPianoKey();
    selectConcertinaButtons();
    if (selection.length > 0) {
        chordBar.style.visibility = "visible";
    } else {
        chordBar.style.visibility = "hidden";
    }
}

function deselectChordButtons() {
    for (let i = 0; i < chordBar.children.length; i++) {
        chordBar.children[i].classList.remove('selected');
    }
}

function playNote(note) {
    let oscillator;
    let gainNode = audioCtx.createGain(); // prerequisite for making the volume adjustable
    let freq = notes[note];
    let fullVolume = 0;
    if (selection.length) {
        fullVolume = -1 + 1 / selection.length // avoid the utter cracklefest on webkit and mobile browsers
    }
    // console.debug(note + " (" + freq + " Hz)");
    oscillator = audioCtx.createOscillator(); // create Oscillator node
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); // value in hertz
    oscillator.connect(audioCtx.destination);
    oscillator.connect(gainNode); // connect the volume control to the oscillator
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(-1, audioCtx.currentTime); // set the volume to -1 when the note first starts playing
    gainNode.gain.linearRampToValueAtTime(fullVolume, audioCtx.currentTime + 0.01); // linearly increase to full volume in 0.1 seconds
    gainNode.gain.linearRampToValueAtTime(-1, audioCtx.currentTime + 0.5); // fade the volume all the way out in 0.5 seconds
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function playSelection() {
    selection.forEach((note) => {
        playNote(note);
    });
}

function moveLeft() {
    if (currentIndex > 0 && currentMode == "view") {
        currentIndex--;
        selection.length = 0;
        updateNoteSelection(activeNotes[currentIndex]);
        playNote(activeNotes[currentIndex]);
    }
}

function moveRight() {
    if (currentIndex < activeNotes.length - 1 && currentMode == "view") {
        currentIndex++;
        selection.length = 0;
        updateNoteSelection(activeNotes[currentIndex]);
        playNote(activeNotes[currentIndex]);
    }
}

function findChord(chord) {
    selection.length = 1;
    let rootIndex;
    for (let i = 0; i < activeNotes.length; i++) {
        if (activeNotes[i] == selection[0]) {
            rootIndex = i;
            break;
        }
    }
    switch (chord) {
        case "maj":
            activeNotes[rootIndex + 4] && selection.push(activeNotes[rootIndex + 4]);
            activeNotes[rootIndex + 7] && selection.push(activeNotes[rootIndex + 7]);
            deselectChordButtons();
            maj.classList.add('selected');
            break;
        case "min":
            activeNotes[rootIndex + 3] && selection.push(activeNotes[rootIndex + 3]);
            activeNotes[rootIndex + 7] && selection.push(activeNotes[rootIndex + 7]);
            deselectChordButtons();
            min.classList.add('selected');
            break;
        case "dim":
            activeNotes[rootIndex + 3] && selection.push(activeNotes[rootIndex + 3]);
            activeNotes[rootIndex + 6] && selection.push(activeNotes[rootIndex + 6]);
            deselectChordButtons();
            dim.classList.add('selected');
            break;
        case "7":
            activeNotes[rootIndex + 4] && selection.push(activeNotes[rootIndex + 4]);
            activeNotes[rootIndex + 7] && selection.push(activeNotes[rootIndex + 7]);
            activeNotes[rootIndex + 10] && selection.push(activeNotes[rootIndex + 10]);
            deselectChordButtons();
            sev.classList.add('selected');
            break;
        case "maj7":
            activeNotes[rootIndex + 4] && selection.push(activeNotes[rootIndex + 4]);
            activeNotes[rootIndex + 7] && selection.push(activeNotes[rootIndex + 7]);
            activeNotes[rootIndex + 11] && selection.push(activeNotes[rootIndex + 11]);
            deselectChordButtons();
            maj7.classList.add('selected');
            break;
        case "min7":
            activeNotes[rootIndex + 3] && selection.push(activeNotes[rootIndex + 3]);
            activeNotes[rootIndex + 7] && selection.push(activeNotes[rootIndex + 7]);
            activeNotes[rootIndex + 10] && selection.push(activeNotes[rootIndex + 10]);
            deselectChordButtons();
            min7.classList.add('selected');
            break;
    }
    selectPianoKey();
    selectConcertinaButtons();
    playSelection();
}


function bindPianoKeys() {
    let allkeys = document.querySelectorAll("#keyboard button");
    allkeys.forEach((key) => key.addEventListener('click', (e) => {
        if (!selection.includes(e.target.dataset.note)) {
            playNote(e.target.dataset.note);
        }
        currentIndex = activeNotes.indexOf(e.target.dataset.note)
        deselectChordButtons();
        updateNoteSelection(e.target.dataset.note);
    }));
}



function bindAngloButtons() {
    let allbuttons = document.querySelectorAll("#anglo-keyboard button");
    allbuttons.forEach((button) => button.addEventListener('click', (e) => {
        if (!selection.includes(e.target.dataset.note)) {
            playNote(e.target.dataset.note);
        }
        currentIndex = activeNotes.indexOf(e.target.dataset.note);
        deselectChordButtons();
        updateNoteSelection(e.target.dataset.note);
    }));
}


function selectLayout() {
    switch (opt_layout.value) {
        case "cgWheatstone30":
            buttons = cgWheatstone30;
            renderAngloKeyboard();
            break;
        case "cgJeffries30":
            buttons = cgJeffries30;
            renderAngloKeyboard();
            break;
        case "cgWheatstone40":
            buttons = cgWheatstone40;
            renderAngloKeyboard();
            break;
        case "cgJeffries38":
            buttons = cgJeffries38;
            renderAngloKeyboard();
            break;
        case "gdWheatstone30":
            buttons = gdWheatstone30;
            renderAngloKeyboard();
            break;
        case "gdJeffries30":
            buttons = gdJeffries30;
            renderAngloKeyboard();
            break;
        case "gdWheatstone40":
            buttons = gdWheatstone40;
            renderAngloKeyboard();
            break;
        case "gdJeffries38":
            buttons = gdJeffries38;
            renderAngloKeyboard();
            break;
        case "bbfWheatstone30":
            buttons = bbfWheatstone30;
            renderAngloKeyboard();
            break;
        case "bbfJeffries30":
            buttons = bbfJeffries30;
            renderAngloKeyboard();
            break;
        case "bbfWheatstone40":
            buttons = bbfWheatstone40;
            renderAngloKeyboard();
            break;
        case "bbfJeffries38":
            buttons = bbfJeffries38;
            renderAngloKeyboard();
            break;
        case "jones":
            buttons = jones;
            renderAngloKeyboard();
            break;
        case "cg20":
            buttons = cg20;
            renderAngloKeyboard();
            break;
        case "gd20":
            buttons = gd20;
            renderAngloKeyboard();
            break;
        case "da20":
            buttons = da20;
            renderAngloKeyboard();
            break;
        case "squashbox":
            buttons = squashbox;
            renderAngloKeyboard();
            break;
        default:
            buttons = parsedLayoutFromURL;
            renderAngloKeyboard();
    }
    opt_layout.blur();
}



// TODO: put custom legacy layout into dropdown, add handler for new layouts
function getUrlParams() {
    if (window.location.href.includes("#layout=")) {
        let legacyParam = window.location.href.split("#layout=")[1];
        if (legacyParam && legacyPaths[legacyParam]) {
            opt_layout.value = legacyPaths[legacyParam];
            selectLayout();
            console.log("selecting a hard-coded layout from legacy param");
        } else if (legacyParam) {
            customLayoutFromURL = legacyParam;
            console.log("parsing custom legacy layout...");
            addToDropdown("customFromURL", "Custom layout");
            parseLegacyLayout();
            opt_layout.value = "customFromURL";
        } else {
            console.log("empty param; proceeding with default");
            selectLayout();
        }
    } else if (window.location.href.includes("?")) {
        let urlParam = window.location.href.split("?")[1];
        if (urlParam && legacyPaths[urlParam]) {
            opt_layout.value = legacyPaths[urlParam];
            selectLayout();
            console.log("selecting a hard-coded layout from new param");
        } else if (urlParam && urlParam.includes("&title=")) {
            customLayoutFromURL = urlParam.split("&title=")[0];
            customTitleFromURL = urlParam.split("&title=")[1];
            if (customTitleFromURL) {
                addToDropdown("customFromURL", decodeURI(customTitleFromURL));
            } else {
                addToDropdown("customFromURL", "Custom layout");
            }
            parseLayout()
            opt_layout.value = "customFromURL";
        } else if (urlParam) {
            customLayoutFromURL = urlParam;
            console.log("parsing custom new layout...");
            addToDropdown("customFromURL", "Custom layout");
            parseLayout();
            opt_layout.value = "customFromURL";
        } else {
            console.log("empty param; proceeding with default");
            selectLayout();
        }
    }
}

function addToDropdown(value, title) {
        let newOption = document.createElement("option");
        // TODO logic to make sure title isn't a duplicate of a hard-coded title or one from localStorage
        newOption.value = value;
        newOption.text = title;
        opt_layout.insertBefore(newOption, opt_layout.firstChild);
        // opt_layout.value = "customFromURL";    
}


opt_layout.addEventListener("change", () => {
    selectLayout();
});

opt_pushpull.addEventListener("change", () => {
    resetView();
});
opt_push.addEventListener("change", () => {
    togglePushView();
});
opt_pull.addEventListener("change", () => {
    togglePullView();
});

opt_coloroctave.addEventListener("change", () => {
    colorOctaves();
});

opt_drone.addEventListener("change", () => {
    selectDrone();
});

opt_concertinaLabels.addEventListener("change", () => {
    renderAngloKeyboard();
});

opt_pianoLabels.addEventListener("change", () => {
    renderAngloKeyboard();
});

opt_accidentals.addEventListener("change", () => {
    renderAngloKeyboard();
});

opt_absentNotes.addEventListener("change", () => {
    renderAngloKeyboard();
});


document.addEventListener('keydown', function (e) {
    // console.log(e.code);
    if (e.code.indexOf('Shift') != -1) {
        multiselect.checked = true;
    } else if (e.code == "ArrowRight") {
        deselectChordButtons();
        moveRight();
    } else if (e.code == "ArrowLeft") {
        deselectChordButtons();
        moveLeft();
    } else if (e.code == "Escape") {
        aboutModal.style.display = "none";
    }
})

document.addEventListener('keyup', function (e) {
    if (e.code.indexOf('Shift') != -1) {
        multiselect.checked = false;
    }
});


// about modal
about.onclick = function () {
    aboutModal.style.display = "block";
}

closeModalBtn.onclick = function () {
    aboutModal.style.display = "none";
}

window.onclick = function (event) {
    if (event.target == aboutModal) {
        aboutModal.style.display = "none";
    }
}

// stuff to do when the page is loaded
function init() {
    opt_pushpull.checked = true;
    if (window.location.href.includes("#") || window.location.href.includes("?")) {
        getUrlParams();
    } else {
        selectLayout();
    }
}

init();