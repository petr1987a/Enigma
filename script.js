document.addEventListener('DOMContentLoaded', () => {
    const ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const ROTOR_CONFIGS = {
        I:   'ЭЮЬЫЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕДГВБА', 
        II:  'ЯЮЭЬЫЪЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕДГВБА', 
        III: 'ДГВБАЯЮЭЬЫЪЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕ',
    };
    const REFLECTOR_CONFIG = 'ПОНМЛКЙИЗЖЁЕДГВБАЯЮЭЬЫЪЩШЧЦХФУТСР';
    
    // --- ЭЛЕМЕНТЫ DOM ---
    const singleLamp = document.getElementById('single-lamp'); // Изменение
    const keyboard = document.getElementById('keyboard');
    const rotorInputs = { 1: document.getElementById('rotor1_pos'), 2: document.getElementById('rotor2_pos'), 3: document.getElementById('rotor3_pos'), };
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const resetButton = document.getElementById('reset-button');
    const themeSwitcher = document.querySelector('.theme-switcher');
    const spaceKey = document.getElementById('key-space');
    const eraseKey = document.getElementById('key-erase');
    const pasteButton = document.getElementById('paste-button');

    let rotors = {
        1: { pos: 0, config: ROTOR_CONFIGS.I,   notch: ALPHABET.indexOf('Е') },
        2: { pos: 0, config: ROTOR_CONFIGS.II,  notch: ALPHABET.indexOf('М') },
        3: { pos: 0, config: ROTOR_CONFIGS.III, notch: ALPHABET.indexOf('Ц') }
    };

    function initializeMachine() { createInterface(); addEventListeners(); resetMachine(); }
    
    function createInterface() {
        keyboard.innerHTML = '';
        for (const letter of ALPHABET) {
            const key = document.createElement('button'); key.className = 'key'; key.id = `key-${letter}`; key.textContent = letter; keyboard.appendChild(key);
        }
    }
    
    function addEventListeners() {
        keyboard.addEventListener('click', e => { if (e.target.classList.contains('key')) handleKeyPress(e.target.textContent); });
        inputText.addEventListener('input', handleTextInput);
        resetButton.addEventListener('click', resetMachine);
        Object.values(rotorInputs).forEach(input => input.addEventListener('input', handleRotorInputChange));
        themeSwitcher.addEventListener('click', handleThemeSwitch);
        spaceKey.addEventListener('click', handleSpaceKey);
        eraseKey.addEventListener('click', handleEraseKey);
        pasteButton.addEventListener('click', handlePasteKey);
    }
    
    function handleRotorInputChange(e) {
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
    
    function handleThemeSwitch(e) {
        if (e.target.classList.contains('theme-button')) {
            const theme = e.target.dataset.theme; document.body.className = theme;
            document.querySelector('.theme-button.active').classList.remove('active');
            e.target.classList.add('active');
        }
    }
    
    function handleSpaceKey() { inputText.value += ' '; inputText.dispatchEvent(new Event('input')); }
    function handleEraseKey() { inputText.value = inputText.value.slice(0, -1); inputText.dispatchEvent(new Event('input')); }
    async function handlePasteKey() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) { inputText.value = text; inputText.dispatchEvent(new Event('input')); }
        } catch (err) { alert('Не удалось получить доступ к буферу обмена.'); }
    }

    function processLetter(letter) {
        rotateRotors();
        let index = ALPHABET.indexOf(letter);
        index = rotorPass(index, 1, false); index = rotorPass(index, 2, false); index = rotorPass(index, 3, false);
        index = ALPHABET.indexOf(REFLECTOR_CONFIG[index]);
        index = rotorPass(index, 3, true); index = rotorPass(index, 2, true); index = rotorPass(index, 1, true);
        return ALPHABET[index];
    }
    
    function rotateRotors() {
        const r1_notch_before = rotors[1].pos === rotors[1].notch;
        const r2_notch_before = rotors[2].pos === rotors[2].notch;
        if (r1_notch_before || r2_notch_before) {
            if (r1_notch_before) rotors[2].pos = (rotors[2].pos + 1) % ALPHABET.length;
            if (r2_notch_before) rotors[3].pos = (rotors[3].pos + 1) % ALPHABET.length;
        }
        rotors[1].pos = (rotors[1].pos + 1) % ALPHABET.length;
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
    
    // --- ИЗМЕНЕНИЕ: Логика подсветки для одной лампы ---
    function lightUpLamp(letter) {
        if(singleLamp) {
            singleLamp.textContent = letter;
            singleLamp.classList.add('on');
            setTimeout(() => {
                singleLamp.classList.remove('on');
                singleLamp.textContent = '–';
            }, 500);
        }
    }

    function setInitialRotorPositions() {
        Object.keys(rotorInputs).forEach(num => {
            let value = rotorInputs[num].value.toUpperCase();
            rotors[num].pos = ALPHABET.includes(value) ? ALPHABET.indexOf(value) : 0;
            rotorInputs[num].value = ALPHABET[rotors[num].pos];
        });
        // --- Убрано обновление дисплеев отсюда ---
    }
    
    // --- НОВАЯ ФУНКЦИЯ: Обновляет дисплеи только при необходимости ---
    function updateRotorDisplays() {
        Object.keys(rotors).forEach(num => {
            rotorInputs[num].value = ALPHABET[rotors[num].pos];
        });
    }
    
    initializeMachine();
});