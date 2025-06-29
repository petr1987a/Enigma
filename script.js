document.addEventListener('DOMContentLoaded', () => {
    // --- НАСТРОЙКИ МАШИНЫ ---
    const ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const ROTOR_CONFIGS = {
        I:   'ЭЮЬЫЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕДГВБА', // Проводка для ротора I
        II:  'ЯЮЭЬЫЪЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕДГВБА', // Проводка для ротора II
        III: 'ДГВБАЯЮЭЬЫЪЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕ', // Проводка для ротора III
    };
    const REFLECTOR_CONFIG = 'ПОНМЛКЙИЗЖЁЕДГВБАЯЮЭЬЫЪЩШЧЦХФУТСР'; // Рефлектор B (симметричный)
    
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
            lamp.className = 'lamp';
            lamp.id = `lamp-${letter}`;
            lamp.textContent = letter;
            lampPanel.appendChild(lamp);

            const key = document.createElement('button');
            key.className = 'key';
            key.id = `key-${letter}`;
            key.textContent = letter;
            keyboard.appendChild(key);
        }
    }

    function addEventListeners() {
        keyboard.addEventListener('click', (e) => {
            if (e.target.classList.contains('key')) {
                handleKeyPress(e.target.textContent);
            }
        });
        inputText.addEventListener('input', handleTextInput);
        resetButton.addEventListener('click', resetMachine);
        Object.values(rotorInputs).forEach(input => input.addEventListener('change', resetMachine));
    }

    // --- ГЛАВНЫЕ ОБРАБОТЧИКИ ---
    function resetMachine() {
        setInitialRotorPositions();
        inputText.value = '';
        outputText.value = '';
    }

    function handleTextInput() {
        // !!! КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ !!!
        // Сбрасываем роторы в начальное положение только перед началом ввода
        setInitialRotorPositions(); 
        let output = '';
        // Убираем все символы, кроме букв из нашего алфавита
        const cleanInput = this.value.toUpperCase().replace(new RegExp(`[^${ALPHABET}]`, 'g'), '');
        
        for (const char of cleanInput) {
             output += processLetter(char);
        }
        outputText.value = output;
    }

    function handleKeyPress(letter) {
        // Добавляем букву в поле ввода, что автоматически вызовет handleTextInput
        inputText.value += letter;
        inputText.dispatchEvent(new Event('input')); // Запускаем событие ввода
        
        const outputLetter = outputText.value.slice(-1);
        if (outputLetter) {
            lightUpLamp(outputLetter);
        }
    }

    // --- ЛОГИКА ШИФРОВАНИЯ ---
    function rotateRotors() {
        // Механизм двойного шага (Double-Stepping)
        const r2_at_notch = rotors[2].pos === rotors[2].notch;

        if (r2_at_notch) {
            rotors[2].pos = (rotors[2].pos + 1) % ALPHABET.length;
            rotors[3].pos = (rotors[3].pos + 1) % ALPHABET.length;
        }

        const r1_at_notch = rotors[1].pos === rotors[1].notch;
        if (r1_at_notch) {
            rotors[2].pos = (rotors[2].pos + 1) % ALPHABET.length;
        }
        
        // Первый ротор вращается всегда
        rotors[1].pos = (rotors[1].pos + 1) % ALPHABET.length;
        
        updateRotorDisplays();
    }
    
    function processLetter(letter) {
        rotateRotors();
        let letterIndex = ALPHABET.indexOf(letter);
        
        // Проход через роторы -> рефлектор -> обратный проход
        letterIndex = rotorPass(letterIndex, 1, false);
        letterIndex = rotorPass(letterIndex, 2, false);
        letterIndex = rotorPass(letterIndex, 3, false);
        
        letterIndex = ALPHABET.indexOf(REFLECTOR_CONFIG[letterIndex]);

        letterIndex = rotorPass(letterIndex, 3, true);
        letterIndex = rotorPass(letterIndex, 2, true);
        letterIndex = rotorPass(letterIndex, 1, true);

        return ALPHABET[letterIndex];
    }
    
    function rotorPass(index, rotorNum, isReverse) {
        const rotor = rotors[rotorNum];
        const shift = rotor.pos;
        let alphabet_index = (index + shift + ALPHABET.length) % ALPHABET.length;

        let char_after_wiring;
        if (!isReverse) {
            char_after_wiring = rotor.config[alphabet_index];
        } else {
            char_after_wiring = ALPHABET[rotor.config.indexOf(ALPHABET[alphabet_index])];
        }
        
        let final_index = ALPHABET.indexOf(char_after_wiring);
        final_index = (final_index - shift + ALPHABET.length) % ALPHABET.length;

        return final_index;
    }

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ИНТЕРФЕЙСА ---
    function lightUpLamp(letter) {
        const lamp = document.getElementById(`lamp-${letter}`);
        if(lamp) {
            lamp.classList.add('on');
            setTimeout(() => lamp.classList.remove('on'), 300);
        }
    }

    function setInitialRotorPositions() {
        Object.keys(rotorInputs).forEach(num => {
            let value = rotorInputs[num].value.toUpperCase();
            if (ALPHABET.includes(value)) {
                rotors[num].pos = ALPHABET.indexOf(value);
            } else {
                rotors[num].pos = 0; // Сброс на 'А', если введено что-то не то
                rotorInputs[num].value = 'А';
            }
        });
        updateRotorDisplays();
    }
    
    function updateRotorDisplays() {
        Object.keys(rotors).forEach(num => {
             rotorInputs[num].value = ALPHABET[rotors[num].pos];
        });
    }

    // --- ЗАПУСК ---
    initializeMachine();
});