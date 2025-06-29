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
    const rotorInputs = {
        1: document.getElementById('rotor1_pos'),
        2: document.getElementById('rotor2_pos'),
        3: document.getElementById('rotor3_pos'),
    };
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const resetButton = document.getElementById('reset-button');
    const themeSwitcher = document.querySelector('.theme-switcher');
    
    // --- СОСТОЯНИЕ МАШИНЫ ---
    let rotors = {
        1: { pos: 0, config: ROTOR_CONFIGS.I,   notch: ALPHABET.indexOf('Е') },
        2: { pos: 0, config: ROTOR_CONFIGS.II,  notch: ALPHABET.indexOf('М') },
        3: { pos: 0, config: ROTOR_CONFIGS.III, notch: ALPHABET.indexOf('Ц') }
    };

    function initializeMachine() {
        createInterface();
        addEventListeners();
        resetMachine();
    }
    
    function createInterface() {
        lampPanel.innerHTML = ''; keyboard.innerHTML = '';
        for (const letter of ALPHABET) {
            const lamp = document.createElement('div');
            lamp.className = 'lamp'; lamp.id = `lamp-${letter}`; lamp.textContent = letter;
            lampPanel.appendChild(lamp);
            const key = document.createElement('button');
            key.className = 'key'; key.id = `key-${letter}`; key.textContent = letter;
            keyboard.appendChild(key);
        }
    }

    function addEventListeners() {
        keyboard.addEventListener('click', e => { if (e.target.classList.contains('key')) handleKeyPress(e.target.textContent); });
        inputText.addEventListener('input', handleTextInput);
        resetButton.addEventListener('click', resetMachine);
        Object.values(rotorInputs).forEach(input => input.addEventListener('input', handleRotorInputChange));
        themeSwitcher.addEventListener('click', handleThemeSwitch);
    }
    
    function handleRotorInputChange(e) {
        let value = e.target.value.toUpperCase();
        if (ALPHABET.includes(value)) {
            resetMachine();
        } else if (value !== '') {
            // Если введено что-то не то, откатываем к предыдущему значению (или к 'А')
            let rotorNum = Object.keys(rotorInputs).find(key => rotorInputs[key] === e.target);
            e.target.value = ALPHABET[rotors[rotorNum].pos] || 'А';
        }
    }

    function resetMachine() {
        setInitialRotorPositions();
        handleTextInput(); // Пересчитываем текст с новыми настройками
    }

    function handleTextInput() {
        setInitialRotorPositions(); 
        let output = '';
        const cleanInput = (inputText.value || '').toUpperCase().replace(new RegExp(`[^${ALPHABET}]`, 'g'), '');
        
        for (const char of cleanInput) {
            // Важно: создаем копию состояния роторов для каждого символа, т.к. processLetter их меняет
            let currentRotorsState = JSON.parse(JSON.stringify(rotors)); 
            output += processLetter(char);
        }
        outputText.value = output;
    }

    function handleKeyPress(letter) {
        inputText.value += letter;
        inputText.dispatchEvent(new Event('input'));
        const outputLetter = outputText.value.slice(-1);
        if (outputLetter) lightUpLamp(outputLetter);
    }
    
    function handleThemeSwitch(e) {
        if (e.target.classList.contains('theme-button')) {
            const theme = e.target.dataset.theme;
            document.body.className = theme;
            document.querySelector('.theme-button.active').classList.remove('active');
            e.target.classList.add('active');
        }
    }

    // --- ОСНОВНАЯ ЛОГИКА ШИФРОВАНИЯ ---
    function processLetter(letter) {
        // --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ЛОГИКИ ---
        // СНАЧАЛА шифруем, ПОТОМ вращаем.
        let index = ALPHABET.indexOf(letter);
        
        index = rotorPass(index, 1, false); index = rotorPass(index, 2, false); index = rotorPass(index, 3, false);
        index = ALPHABET.indexOf(REFLECTOR_CONFIG[index]);
        index = rotorPass(index, 3, true); index = rotorPass(index, 2, true); index = rotorPass(index, 1, true);
        
        rotateRotors(); // Вращаем роторы ПОСЛЕ получения зашифрованной буквы

        return ALPHABET[index];
    }
    
    function rotateRotors() {
        const r1_will_notch = rotors[1].pos === rotors[1].notch;
        const r2_will_notch = rotors[2].pos === rotors[2].notch;

        if (r1_will_notch) {
            rotors[2].pos = (rotors[2].pos + 1) % ALPHABET.length;
        }
        if (r1_will_notch && r2_will_notch) { // Упрощенная, но рабочая модель "двойного шага"
            rotors[3].pos = (rotors[3].pos + 1) % ALPHABET.length;
        }

        rotors[1].pos = (rotors[1].pos + 1) % ALPHABET.length;
    }
    
    function rotorPass(index, rotorNum, isReverse) {
        const rotor = rotors[rotorNum];
        const shift = rotor.pos;
        let alphabet_index = (index + shift + ALPHABET.length) % ALPHABET.length;

        let char_after_wiring;
        if (!isReverse) {
            char_after_wiring = rotor.config[alphabet_index];
        } else {
            const inputChar = ALPHABET[alphabet_index];
            char_after_wiring = ALPHABET[rotor.config.indexOf(inputChar)];
        }
        
        let final_index = ALPHABET.indexOf(char_after_wiring);
        return (final_index - shift + ALPHABET.length) % ALPHABET.length;
    }

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    function lightUpLamp(letter) {
        const lamp = document.getElementById(`lamp-${letter}`);
        if(lamp) { lamp.classList.add('on'); setTimeout(() => lamp.classList.remove('on'), 300); }
    }

    function setInitialRotorPositions() {
        Object.keys(rotorInputs).forEach(num => {
            let value = rotorInputs[num].value.toUpperCase();
            rotors[num].pos = ALPHABET.includes(value) ? ALPHABET.indexOf(value) : 0;
        });
    }
    
    initializeMachine();
});
