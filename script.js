// Код до этого места остаётся БЕЗ ИЗМЕНЕНИЙ.
// Просто скопируйте этот блок и ДОБАВЬТЕ его в самый конец вашего существующего `script.js` файла.
// Или полностью замените файл, чтобы избежать путаницы.

document.addEventListener('DOMContentLoaded', () => {
    // --- НАСТРОЙКИ МАШИНЫ ---
    const ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const ROTOR_CONFIGS = {
        I:   'ЭЮЬЫЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕДГВБА', 
        II:  'ЯЮЭЬЫЪЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕДГВБА', 
        III: 'ДГВБАЯЮЭЬЫЪЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕ',
    };
    const REFLECTOR_CONFIG = 'ПОНМЛКЙИЗЖЁЕДГВБАЯЮЭЬЫЪЩШЧЦХФУТСР';
    
    // --- ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ---
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

    // --- ФУНКЦИИ ИНИЦИАЛИЗАЦИИ ---
    function initializeMachine() {
        createInterface();
        addEventListeners();
        resetMachine();
    }
    
    function createInterface() {
        lampPanel.innerHTML = '';
        keyboard.innerHTML = '';
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
        keyboard.addEventListener('click', (e) => {
            if (e.target.classList.contains('key')) handleKeyPress(e.target.textContent);
        });
        inputText.addEventListener('input', handleTextInput);
        resetButton.addEventListener('click', resetMachine);
        Object.values(rotorInputs).forEach(input => input.addEventListener('change', resetMachine));
        themeSwitcher.addEventListener('click', handleThemeSwitch);
    }

    // --- ГЛАВНЫЕ ОБРАБОТЧИКИ ---
    function resetMachine() {
        setInitialRotorPositions();
        inputText.value = '';
        outputText.value = '';
    }

    function handleTextInput() {
        setInitialRotorPositions(); 
        let output = '';
        const cleanInput = this.value.toUpperCase().replace(new RegExp(`[^${ALPHABET}]`, 'g'), '');
        for (const char of cleanInput) output += processLetter(char);
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
            // Обновляем активную кнопку
            document.querySelector('.theme-button.active').classList.remove('active');
            e.target.classList.add('active');
        }
    }

    // --- ЛОГИКА ШИФРОВАНИЯ ---
    function rotateRotors() {
        const r2_at_notch = rotors[2].pos === rotors[2].notch;
        if (r2_at_notch) {
            rotors[2].pos = (rotors[2].pos + 1) % ALPHABET.length;
            rotors[3].pos = (rotors[3].pos + 1) % ALPHABET.length;
        }
        const r1_at_notch = rotors[1].pos === rotors[1].notch;
        if (r1_at_notch) rotors[2].pos = (rotors[2].pos + 1) % ALPHABET.length;
        rotors[1].pos = (rotors[1].pos + 1) % ALPHABET.length;
        updateRotorDisplays();
    }
    
    function processLetter(letter) {
        rotateRotors();
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
        if (!isReverse) char_after_wiring = rotor.config[alphabet_index];
        else char_after_wiring = ALPHABET[rotor.config.indexOf(ALPHABET[alphabet_index])];
        let final_index = ALPHABET.indexOf(char_after_wiring);
        return (final_index - shift + ALPHABET.length) % ALPHABET.length;
    }

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ИНТЕРФЕЙСА ---
    function lightUpLamp(letter) {
        const lamp = document.getElementById(`lamp-${letter}`);
        if(lamp) { lamp.classList.add('on'); setTimeout(() => lamp.classList.remove('on'), 300); }
    }

    function setInitialRotorPositions() {
        Object.keys(rotorInputs).forEach(num => {
            let value = rotorInputs[num].value.toUpperCase();
            rotors[num].pos = ALPHABET.includes(value) ? ALPHABET.indexOf(value) : 0;
            rotorInputs[num].value = ALPHABET[rotors[num].pos];
        });
        updateRotorDisplays();
    }
    
    function updateRotorDisplays() {
        Object.keys(rotors).forEach(num => { rotorInputs[num].value = ALPHABET[rotors[num].pos]; });
    }

    // --- ЗАПУСК ---
    initializeMachine();
});
