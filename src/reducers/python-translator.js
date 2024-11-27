const OPEN_CLOSE_TRANSLATOR = 'scratch-gui/python-translator/OPEN_CLOSE_TRANSLATOR';
const CLOSE_TRANSLATOR = 'scratch-gui/python-translator/CLOSE_TRANSLATOR';
const SET_TRANSLATED_CONTENT = 'scratch-gui/python-translator/SET_TRANSLATED_CONTENT';
const SET_TRANSLATOR_STATUS = 'scratch-gui/python-translator/SET_TRANSLATOR_STATUS'
const SET_TEXTAREA_SCROLL_POS = 'scratch-gui/python-translator/SET_TEXTAREA_SCROLL_POS';

// Initial state of react-redux for particular component
const initialState = {
    isTranslatorOpened: false,
    translatedContent: '',
    translatorStatus: '',
    textareaScrollPos: [0, 0]
};

// Reducer
const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;

    switch (action.type) {
    case OPEN_CLOSE_TRANSLATOR:
        return Object.assign({}, state, {
            isTranslatorOpened: !state.isTranslatorOpened
        });
    case CLOSE_TRANSLATOR:
        return Object.assign({}, state, {
            isTranslatorOpened: false
        });
    case SET_TRANSLATED_CONTENT:
        return Object.assign({}, state, {
            translatedContent: action.content
        });
    case SET_TRANSLATOR_STATUS:
        return Object.assign({}, state, {
            translatorStatus: action.content
        });
    case SET_TEXTAREA_SCROLL_POS:
        return Object.assign({}, state, {
            textareaScrollPos: action.content
        });
    default:
        return state;
    }
};


// Actions
const getIsTranslatorOpened = function (state) {
    return state.scratchGui.pythonTranslator.isTranslatorOpened;
};

const getTranslatedContent = function (state){
    //console.log(state.scratchGui.vm.runtime.targets);
    return state.scratchGui.pythonTranslator.translatedContent;
}

const getTargets = function (state){
    // TODO: For real-time translating (map state to prop in python translator)
    return state.scratchGui.vm.runtime.targets;
}

const openCloseTranslator = function () {
    return {
        type: OPEN_CLOSE_TRANSLATOR
    };
};

const closeTranslator = function () {
    return {
        type: CLOSE_TRANSLATOR
    }
}

const setTranslatedContent = function (content) {
    return {
        type: SET_TRANSLATED_CONTENT,
        content: content
    }
}

const getTranslatorStatus = function(state) {
    return state.scratchGui.pythonTranslator.translatorStatus;
}

const setTranslatorStatus = function(content) {
    return {
        type: SET_TRANSLATOR_STATUS,
        content: content
    }
}

const getTextareaScrollPos = function(state) {
    return state.scratchGui.pythonTranslator.textareaScrollPos;
}

const setTextareaScrollPos = function(content) {
    return {
        type: SET_TEXTAREA_SCROLL_POS,
        content: content
    }
}


// Export
export {
    reducer as default,
    initialState as pythonTranslatorInitialState,
    getIsTranslatorOpened,
    getTranslatedContent,
    openCloseTranslator,
    closeTranslator,
    setTranslatedContent,
    getTranslatorStatus,
    setTranslatorStatus,
    getTextareaScrollPos,
    setTextareaScrollPos
};
