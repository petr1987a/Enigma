document.addEventListener('DOMContentLoaded', () => {
    // --- КОНСТАНТЫ МАШИНЫ ---
    const ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const ROTOR_CONFIGS = {
        I:   'ЭЮЬЫЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕДГВБА', 
        II:  'ЯЮЭЬЫЪЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕДГВБА', 
        III: 'ДГВБАЯЮЭЬЫЪЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕ',
    };
    const REFLECTOR_CONFIG = 'ПОНМЛКЙИЗЖЁЕДГВБАЯЮЭЬЫЪЩШЧЦХФУТСР';
    
    // --- ЭЛЕМЕНТЫ DOM ---
    const lampPanel = document.getElementById('lamp-panel');
    const keyboard = document.getElementById('keyboard');
    const rotorInputs = { 1: document.getElementById('rotor1_pos'), 2: document.getElementById('rotor2_pos'), 3: document.getElementById('rotor3_pos'), };
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const resetButton = document.getElementById('reset-button');
    const spaceKey = document.getElementById('key-space');
    const eraseKey = document.getElementById('key-erase');

    // --- СОСТОЯНИЕ МАШИНЫ ---
    let rotors = {
        1: { pos: 0, config: ROTOR_CONFIGS.I },
        2: { pos: 0, config: ROTOR_CONFIGS.II },
        3: { pos: 0, config: ROTOR_CONFIGS.III }
    };

    function initializeMachine() { createInterface(); addEventListeners(); resetMachine(); }
    function createInterface() {
        lampPanel.innerHTML = ''; keyboard.innerHTML = '';
        for (const letter of ALPHABET) {
            const lamp = document.createElement('div'); lamp.className = 'lamp'; lamp.id = `lamp-${letter}`; lamp.textContent = letter; lampPanel.appendChild(lamp);
            const key = document.createElement('button'); key.className = 'key'; key.id = `key-${letter}`; key.textContent = letter; keyboard.appendChild(key);
        }
    }
    function addEventListeners() {
        keyboard.addEventListener('click', e => { if (e.target.classList.contains('key')) handleKeyPress(e.target.textContent); });
        inputText.addEventListener('input', handleTextInput);
        resetButton.addEventListener('click', resetMachine);
        Object.values(rotorInputs).forEach(input => input.addEventListener('input', handleRotorInputChange));
        spaceKey.addEventListener('click', handleSpaceKey);
        eraseKey.addEventListener('click', handleEraseKey);

        // Сенсорные кнопки ▲▼ для роторов
        document.querySelectorAll('.rotor-up').forEach(btn => {
            btn.addEventListener('click', () => {
                let n = btn.dataset.rotor;
                changeRotorPosition(n, 1);
            });
        });
        document.querySelectorAll('.rotor-down').forEach(btn => {
            btn.addEventListener('click', () => {
                let n = btn.dataset.rotor;
                changeRotorPosition(n, -1);
            });
        });
    }

    function handleRotorInputChange(e) {
        // Только заглавные буквы алфавита
        let value = e.target.value.toUpperCase();
        if (!ALPHABET.includes(value) && value !== '') {
            let rotorNum = Object.keys(rotorInputs).find(key => rotorInputs[key] === e.target);
            e.target.value = ALPHABET[rotors[rotorNum].pos] || 'А';
        }
        resetMachine();
    }

    function resetMachine() { setInitialRotorPositions(); handleTextInput(); }
    function handleTextInput() {
        setInitialRotorPositions(); 
        let output = '';
        const cleanInput = (inputText.value || '').toUpperCase().replace(new RegExp(`[^${ALPHABET} ]`, 'g'), '');
        for (const char of cleanInput) {
            if (char === ' ') { output += ' '; } 
            else { output += processLetter(char); }
        }
        outputText.value = output;
    }

    function handleKeyPress(letter) {
        inputText.value += letter;
        inputText.dispatchEvent(new Event('input'));
        const outputLetter = outputText.value.split(' ').join('').slice(-1);
        if (outputLetter) lightUpLamp(outputLetter);
    }
    function handleSpaceKey() { inputText.value += ' '; inputText.dispatchEvent(new Event('input')); }
    function handleEraseKey() { inputText.value = inputText.value.slice(0, -1); inputText.dispatchEvent(new Event('input')); }

    function processLetter(letter) {
        // БЕЗ вращения роторов!
        let index = ALPHABET.indexOf(letter);
        index = rotorPass(index, 1, false); index = rotorPass(index, 2, false); index = rotorPass(index, 3, false);
        index = ALPHABET.indexOf(REFLECTOR_CONFIG[index]);
        index = rotorPass(index, 3, true); index = rotorPass(index, 2, true); index = rotorPass(index, 1, true);
        return ALPHABET[index];
    }

    function rotorPass(index, rotorNum, isReverse) {
        const rotor = rotors[rotorNum], shift = rotor.pos;
        let alphabet_index = (index + shift + ALPHABET.length) % ALPHABET.length;
        let char_after_wiring;
        if (!isReverse) { char_after_wiring = rotor.config[alphabet_index]; } 
        else { const inputChar = ALPHABET[alphabet_index]; char_after_wiring = ALPHABET[rotor.config.indexOf(inputChar)]; }
        let final_index = ALPHABET.indexOf(char_after_wiring);
        return (final_index - shift + ALPHABET.length) % ALPHABET.length;
    }

    function lightUpLamp(letter) { 
        const lamp = document.getElementById(`lamp-${letter}`); 
        if(lamp) { 
            lamp.classList.remove('on');
            void lamp.offsetWidth;
            lamp.classList.add('on'); 
            setTimeout(() => lamp.classList.remove('on'), 350); 
        } 
    }

    function setInitialRotorPositions() { 
        Object.keys(rotorInputs).forEach(num => { 
            let value = rotorInputs[num].value.toUpperCase(); 
            rotors[num].pos = ALPHABET.includes(value) ? ALPHABET.indexOf(value) : 0; 
        }); 
    }

    function changeRotorPosition(rotorNum, delta) {
        let input = rotorInputs[rotorNum];
        let pos = ALPHABET.indexOf(input.value);
        pos = (pos + delta + ALPHABET.length) % ALPHABET.length;
        input.value = ALPHABET[pos];
        setInitialRotorPositions();
        handleTextInput();
    }

    initializeMachine();
});