import classNames from 'classnames';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import React, { createRef } from 'react';

import VM from 'scratch-vm';

import PythonTranslatorHeader from './python-translator-header';
import PythonTranslatorContent from './python-translator-content';

import {
    getIsTranslatorOpened,
    getTranslatedContent,
    closeTranslator,
    setTranslatedContent,
    getTranslatorStatus,
    setTranslatorStatus,
    getTextareaScrollPos,
    setTextareaScrollPos
} from '../../reducers/python-translator';

import styles from './python-translator.css';

import { originalPythonCode } from './python-code-library';


class PythonTranslator extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClickCloseTranslator',
            'handleClickTranslate',
            'handleClickCopyContent',
            'handleProjectChange',
            'handleTargetsChange'
        ]);

        this.translatorStatusTimer;
        this.textareaRef = createRef(); // Create a ref for the textarea
        this.textareaScrollTop = 0;
        this.textareaScrollLeft = 0;
    }

    componentDidMount () {
        // Set textarea scroll position if we closed and opened python translator
        [this.textareaScrollTop, this.textareaScrollLeft] = this.props.textareaScrollPos;
        if(this.textareaRef.current){
            this.textareaRef.current.scrollTop = this.textareaScrollTop;
            this.textareaRef.current.scrollLeft = this.textareaScrollLeft;
        }
        // For real time tranlsating: React Redux uses shallow comparison for state / props - compares only references to objects,
        // so we need to compare with adding listeners, which are already implemented in Scratch
        this.props.vm.addListener('PROJECT_CHANGED', this.handleProjectChange);
        this.props.vm.addListener('targetsUpdate', this.handleTargetsChange);
        this.handleClickTranslate();
    }
    componentWillUnmount () {
        if(this.textareaRef.current){
            this.props.updateTextareaScrollPos([this.textareaRef.current.scrollTop, this.textareaRef.current.scrollLeft]);
        }
        this.props.vm.removeListener('PROJECT_CHANGED', this.handleProjectChange);
        this.props.vm.removeListener('targetsUpdate', this.handleTargetsChange);
    }

    handleProjectChange(){
        // Try-catch needed for some instances when event blocks are not fully set up
        // example: event block "when greater than" (value block is not yet set up on the first onChangeEvent (when hovering block))
        // but when placed down, it is set up
        try{
            this.handleClickTranslate();
        }catch(err){
            //console.log(err.message);
        }
        
    }

    handleTargetsChange(emitProjectChanged){
        try{
            this.handleClickTranslate();
        }catch(err){
            //console.log(err.message);
        }
    }

    handleClickCloseTranslator () {
        this.props.onClickCloseTranslator();
    }

    handleClickCopyContent(){
        navigator.clipboard.writeText(this.props.translatedContent)
        .then(() => {
            // Set status to trasnlated for some seconds, then set status back to empty
            // Clear the previous timer if it exists
            this.props.updateTranslatorStatus("Kopirano!");
            if (this.translatorStatusTimer) {
                clearTimeout(this.translatorStatusTimer);
            }
            // Set a new timer
            this.translatorStatusTimer = setTimeout(() => {
                this.props.updateTranslatorStatus("");
            }, 4000);
        })
        .catch(err => {
            console.error('Error copying text: ', err);
        });
    }

    // Main method to translate Scratch
    handleClickTranslate () {
        // !When updating python-code-library, make sure to convert all \n to \\n so it will corectly work in Python!
        
        //console.log(this.props.vm.runtime);

        const eventBlocksOpcodes = ['event_whenflagclicked', 'event_whenkeypressed', 'event_whenthisspriteclicked', 'event_whenstageclicked', 'event_whenbackdropswitchesto', 'event_whengreaterthan', 'event_whenbroadcastreceived', 'control_start_as_clone'];
        // Clone original python code, so that we don't override it
        let pythonCode = structuredClone(originalPythonCode);
        // Replace escaped newline characters (\n) with escape newline chars, so when pythoncode is created, the original newline characters are there and not actuall new lines
        pythonCode = pythonCode.replace(/\\n/g, "\\\\n");
        let tab = '    ';

        // Get stage backdrop names, current backdrop index, sound names, sound volume, draw list without stage
        const getData = () => {
            let backdropNames = [];
            let currentBackdropIndex = 0;
            let backdropData = [];
            let stageSoundNames = [];
            let stageSoundVolume = 100;
            let drawList = [];
            let stageDrawableId = 0;
            const targets = this.props.vm.runtime.targets;
            for(const target of targets){
                if(target.isStage){
                    const backdrops = target.sprite.costumes_;
                    const sounds = target.sprite.sounds;
                    for(const backdrop of backdrops){
                        backdropNames.push(backdrop.name);
                        let bitmapRes = backdrop.bitmapResolution;
                        if(bitmapRes == undefined){
                            bitmapRes = 1;
                        }
                        let lst = [backdrop.name, backdrop.rotationCenterX, backdrop.rotationCenterY, bitmapRes];
                        backdropData.push(lst);
                    }
                    for(const sound of sounds){
                        stageSoundNames.push(sound.name);
                    }
                    currentBackdropIndex = target.currentCostume;
                    stageSoundVolume = target.volume;
                    stageDrawableId = target.drawableID;
                    break;
                }
            }
            drawList = structuredClone(this.props.vm.runtime.renderer._drawList);
            const stageDrawableIdIndex = drawList.indexOf(stageDrawableId);
            drawList.splice(stageDrawableIdIndex, 1);
            return [backdropNames, currentBackdropIndex, backdropData, stageSoundNames, stageSoundVolume, drawList];
        }

        // Get all blocks and arguments of a target (sprite / stage)
        const getTargetBlocks = (target) => {
            const targetBlocks = {};
            const targetEventBlocks = [];
            const blocks = target.blocks;
            for (const blockId in blocks._blocks) {
                const block = blocks._blocks[blockId];
                targetBlocks[blockId] = block;
                if(eventBlocksOpcodes.includes(block.opcode)){
                    targetEventBlocks.push(blockId);
                }
            }
            return [targetBlocks, targetEventBlocks];
        };

        // Convert Scratch bool to Python bool, by using integets
        const convertBool = (boolValue) => {
            if(boolValue){
                return 1;
            }else{
                return 0;
            }
        }

        // Translate event block to Python - not recursive
        const translateEvent = (blockId, targetBlocks, scriptName) => {
            // First translate the event block itself - create a script (Script object), then translate all the blocks following the event - create script content (async function)
            const block = targetBlocks[blockId];
            const opcode = block.opcode;
            const fields = block.fields;
            const inputs = block.inputs;
            const nextBlockId = block.next;
            let myScript = "";
            let scriptContent = "";
            let eventType = "";
            switch(opcode){
                case "event_whenflagclicked":
                    myScript = `Script(func=${scriptName})`;
                    eventType = "EnumEventType.EVENT_START.value";
                    break;
                case "event_whenkeypressed":
                    let key = fields.KEY_OPTION.value;
                    myScript = `Script(func=${scriptName}, condition=condition_event_button_pressed, conditionStaticArgs={"requiredButton": "${key}"})`;
                    eventType = "EnumEventType.EVENT_BUTTON_PRESSED.value";
                    break;
                case "event_whenthisspriteclicked":
                    myScript = `Script(func=${scriptName})`;
                    eventType = "EnumEventType.EVENT_FIGURE_CLICKED.value";
                    break;
                case "event_whenstageclicked":
                    myScript = `Script(func=${scriptName})`;
                    eventType = "EnumEventType.EVENT_BACKDROP_CLICKED.value";
                    break;
                case "event_whenbackdropswitchesto":
                    let backdropName = fields.BACKDROP.value;
                    myScript = `Script(func=${scriptName}, condition=condition_event_backdrop_changed, conditionStaticArgs={"requiredBackdropName": "${backdropName}"})`;
                    eventType = "EnumEventType.EVENT_BACKDROP_CHANGED.value";
                    break;
                case "event_whengreaterthan":
                    let greaterThan = fields.WHENGREATERTHANMENU.value;
                    let value = translateBlocks(inputs.VALUE.block, targetBlocks, 0);
                    myScript = `Script(func=${scriptName}, condition=condition_event_exceeded, conditionStaticArgs={"requiredEvent": "${greaterThan}", "requiredValue": ${value}})`;
                    eventType = "EnumEventType.EVENT_EXCEEDED.value";
                    break;
                case "event_whenbroadcastreceived":
                    let broadcastName = fields.BROADCAST_OPTION.value;
                    myScript = `Script(func=${scriptName}, condition=condition_event_broadcast_recieved, conditionStaticArgs={"requiredBroadcastValue": "${broadcastName}"})`;
                    eventType = "EnumEventType.EVENT_BROADCAST_RECIEVED.value";
                    break;
                case "control_start_as_clone":
                    myScript = `Script(func=${scriptName})`;
                    eventType = "EnumEventType.EVENT_START_CLONE.value";
                    break;
                default:
                    myScript = "";
            }

            scriptContent = translateBlocks(nextBlockId, targetBlocks, 1);
            if(scriptContent === ""){
                scriptContent = `${tab.repeat(1)}pass`;
            }
            return [myScript, scriptContent, eventType];
        }

        // Translate blocks to Python, go to recursion if nested blocks
        const translateBlocks = (blockId, targetBlocks, nests) => {
            if(blockId == null){
                return '';
            }

            const block = targetBlocks[blockId];
            const opcode = block.opcode; // type of block or attribute
            const fields = block.fields; // attributes have fields that represent actual values
            const inputs = block.inputs; // blocks have inputs that represent attributes (with ids)
            const next = block.next; // id of the next (sequential) block, only blocks show id of the next block
            const parent = block.parent; // id of the parent block
            const shadow = block.shadow; // block or attribute that provides a default value or placeholder within other blocks ()

            let space = tab.repeat(nests);
            let loopFrame = 'await target._sleep(target._game.frameDuration)';

            // Translate blocks based on opcode
            switch (opcode){

                // #region --- MOTION BLOCKS --- 

                // Main
                case "motion_movesteps":
                    return `${space}target.motion_move(${translateBlocks(inputs.STEPS.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_turnright":
                    return `${space}target.motion_rotate_right(${translateBlocks(inputs.DEGREES.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);
                    
                case "motion_turnleft":
                    return `${space}target.motion_rotate_left(${translateBlocks(inputs.DEGREES.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_goto":
                    return `${space}target.motion_go_to(${translateBlocks(inputs.TO.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);
                    
                case "motion_gotoxy":
                    return `${space}target.motion_go_to_xy(${translateBlocks(inputs.X.block, targetBlocks, nests)}, ${translateBlocks(inputs.Y.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_glideto":
                    return `${space}await target.motion_slide_to_async(${translateBlocks(inputs.SECS.block, targetBlocks, nests)}, ${translateBlocks(inputs.TO.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_glidesecstoxy":
                    return `${space}await target.motion_slide_to_xy_async(${translateBlocks(inputs.SECS.block, targetBlocks, nests)}, ${translateBlocks(inputs.X.block, targetBlocks, nests)}, ${translateBlocks(inputs.Y.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_pointindirection":
                    return `${space}target.motion_rotate_to(${translateBlocks(inputs.DIRECTION.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_pointtowards":
                    return `${space}target.motion_rotate_towards(${translateBlocks(inputs.TOWARDS.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_changexby":
                    return `${space}target.motion_change_x_for(${translateBlocks(inputs.DX.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_setx":
                    return `${space}target.motion_set_x_to(${translateBlocks(inputs.X.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_changeyby":
                    return `${space}target.motion_change_y_for(${translateBlocks(inputs.DY.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_sety":
                    return `${space}target.motion_set_y_to(${translateBlocks(inputs.Y.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_ifonedgebounce":
                    return `${space}target.motion_bounce_if_edge()` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "motion_setrotationstyle":
                    return `${space}target.motion_change_rotate_style("${fields.STYLE.value}")` + '\n' + translateBlocks(next, targetBlocks, nests);

                // Values
                case "motion_xposition":
                    return "target.motion_position_x()";
                
                case "motion_yposition":
                    return "target.motion_position_y()";

                case "motion_direction":
                    return "target.motion_direction()";

                // Additional
                case "motion_goto_menu":
                    return `"${fields.TO.value}"`;
                
                case "motion_glideto_menu":
                    return `"${fields.TO.value}"`;

                case "motion_pointtowards_menu":
                    return `"${fields.TOWARDS.value}"`;

                // #endregion

                // #region --- LOOKS BLOCKS --- 

                // Main
                case "looks_sayforsecs":
                    return `${space}await target.looks_say_for_seconds_async(${translateBlocks(inputs.MESSAGE.block, targetBlocks, nests)}, ${translateBlocks(inputs.SECS.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_say":
                    return `${space}target.looks_say(${translateBlocks(inputs.MESSAGE.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_thinkforsecs":
                    return `${space}await target.looks_think_for_seconds_async(${translateBlocks(inputs.MESSAGE.block, targetBlocks, nests)}, ${translateBlocks(inputs.SECS.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);
                
                case "looks_think":
                    return `${space}target.looks_think(${translateBlocks(inputs.MESSAGE.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_switchcostumeto":
                    return `${space}target.looks_change_costume_to(${translateBlocks(inputs.COSTUME.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_nextcostume":
                    return `${space}target.looks_next_costume()` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_switchbackdropto":
                    return `${space}target.looks_change_backdrop_to(${translateBlocks(inputs.BACKDROP.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_switchbackdroptoandwait":
                    return `${space}await target.looks_change_backdrop_to_and_wait_async(${translateBlocks(inputs.BACKDROP.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_nextbackdrop":
                    return `${space}target.looks_next_backdrop()` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_changesizeby":
                    return `${space}target.looks_change_size_for(${translateBlocks(inputs.CHANGE.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_setsizeto":
                    return `${space}target.looks_change_size_to(${translateBlocks(inputs.SIZE.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_changeeffectby":
                    return `${space}target.looks_change_effect_for("${fields.EFFECT.value}", ${translateBlocks(inputs.CHANGE.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_seteffectto":
                    return `${space}target.looks_set_effect_to("${fields.EFFECT.value}", ${translateBlocks(inputs.VALUE.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_cleargraphiceffects":
                    return `${space}target.looks_remove_effects()` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_show":
                    return `${space}target.looks_show()` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_hide":
                    return `${space}target.looks_hide()` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_gotofrontback":
                    return `${space}target.looks_go_to_layer("${fields.FRONT_BACK.value}")` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "looks_goforwardbackwardlayers":
                    return `${space}target.looks_go_for_layers("${fields.FORWARD_BACKWARD.value}", ${translateBlocks(inputs.NUM.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);
                
                // Values
                case "looks_costumenumbername":
                    return `target.looks_costume("${fields.NUMBER_NAME.value}")`;

                case "looks_backdropnumbername":
                    return `target.looks_backdrop("${fields.NUMBER_NAME.value}")`;

                case "looks_size":
                    return `target.looks_size()`;

                // Additional
                case "looks_costume":
                    return `"${fields.COSTUME.value}"`;

                case "looks_backdrops":
                    return `"${fields.BACKDROP.value}"`;

                // #endregion

                // #region --- SOUND BLOCKS --- 

                // Main
                case "sound_playuntildone":
                    return `${space}await target.sound_play_sound_until_done_async(${translateBlocks(inputs.SOUND_MENU.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "sound_play":
                    return `${space}target.sound_play_sound(${translateBlocks(inputs.SOUND_MENU.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "sound_stopallsounds":
                    return `${space}target.sound_stop_all_sounds()` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "sound_changeeffectby":
                    return `${space}target.sound_change_effect_for("${fields.EFFECT.value}", ${translateBlocks(inputs.VALUE.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);
                
                case "sound_seteffectto":
                    return `${space}target.sound_change_effect_to("${fields.EFFECT.value}", ${translateBlocks(inputs.VALUE.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);
                
                case "sound_cleareffects":
                    return `${space}target.sound_remove_effects()` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "sound_changevolumeby":
                    return `${space}target.sound_change_volume_for(${translateBlocks(inputs.VOLUME.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "sound_setvolumeto":
                    return `${space}target.sound_change_volume_to(${translateBlocks(inputs.VOLUME.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                // Values
                case "sound_volume":
                    return `target.sound_volume()`;

                // Additional
                case "sound_sounds_menu":
                    return `"${fields.SOUND_MENU.value}"`;

                // #endregion

                // #region --- EVENTS BLOCKS --- 

                // Main
                case "event_broadcast":
                    return `${space}target.events_broadcast(${translateBlocks(inputs.BROADCAST_INPUT.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "event_broadcastandwait":
                    return `${space}await target.events_broadcast_wait_async(${translateBlocks(inputs.BROADCAST_INPUT.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                // Values

                // Additional
                case "event_broadcast_menu":
                    return `"${fields.BROADCAST_OPTION.value}"`;

                // #endregion

                // #region --- CONTROL BLOCKS --- 

                // Main
                case "control_wait":
                    return `${space}await target.control_wait_async(${translateBlocks(inputs.DURATION.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "control_repeat":
                    var substack = `${space.concat(tab).concat(loopFrame)}`;
                    if('SUBSTACK' in inputs && inputs.SUBSTACK.block !== null){
                        substack = `${translateBlocks(inputs.SUBSTACK.block, targetBlocks, nests+1)}` + substack;
                    }
                    return `${space}for i in range(${translateBlocks(inputs.TIMES.block, targetBlocks, nests)}):\n` + substack + '\n' + translateBlocks(next, targetBlocks, nests);

                case "control_forever":
                    var substack = `${space.concat(tab).concat(loopFrame)}`;
                    if('SUBSTACK' in inputs && inputs.SUBSTACK.block !== null){
                        substack = `${translateBlocks(inputs.SUBSTACK.block, targetBlocks, nests+1)}` + substack;
                    }
                    return `${space}while (True):\n` + substack + '\n' + translateBlocks(next, targetBlocks, nests);

                case "control_if":
                    var substack = `${space.concat(tab)}pass\n`;
                    if('SUBSTACK' in inputs && inputs.SUBSTACK.block !== null){
                        substack = `${translateBlocks(inputs.SUBSTACK.block, targetBlocks, nests+1)}`;
                    }
                    var condition = 'None';
                    if('CONDITION' in inputs && inputs.CONDITION.block !== null){
                        condition = `${translateBlocks(inputs.CONDITION.block, targetBlocks, nests+1)}`;
                    }
                    return `${space}if(${condition}):\n` + substack + translateBlocks(next, targetBlocks, nests);

                case "control_if_else":
                    var substack1 = `${space.concat(tab)}pass\n`;
                    if('SUBSTACK' in inputs && inputs.SUBSTACK.block !== null){
                        substack1 = `${translateBlocks(inputs.SUBSTACK.block, targetBlocks, nests+1)}`;
                    }
                    var substack2 = `${space.concat(tab)}pass\n`;
                    if('SUBSTACK2' in inputs && inputs.SUBSTACK2.block !== null){
                        substack2 = `${translateBlocks(inputs.SUBSTACK2.block, targetBlocks, nests+1)}`;
                    }
                    var condition = 'None';
                    if('CONDITION' in inputs && inputs.CONDITION.block !== null){
                        condition = `${translateBlocks(inputs.CONDITION.block, targetBlocks, nests+1)}`;
                    }
                    return `${space}if(${condition}):\n` + substack1 + `${space}else:\n` + substack2 + translateBlocks(next, targetBlocks, nests);

                case "control_wait_until":
                    var substack = `${space.concat(tab).concat(loopFrame)}`;
                    var condition = 'None';
                    if('CONDITION' in inputs && inputs.CONDITION.block !== null){
                        condition = `${translateBlocks(inputs.CONDITION.block, targetBlocks, nests+1)}`;
                    }
                    return `${space}while not (${condition}):\n` + substack + '\n' + translateBlocks(next, targetBlocks, nests);

                case "control_repeat_until":
                    var substack = `${space.concat(tab).concat(loopFrame)}`;
                    if('SUBSTACK' in inputs && inputs.SUBSTACK.block !== null){
                        substack = `${translateBlocks(inputs.SUBSTACK.block, targetBlocks, nests+1)}` + substack;
                    }
                    var condition = 'None';
                    if('CONDITION' in inputs && inputs.CONDITION.block !== null){
                        condition = `${translateBlocks(inputs.CONDITION.block, targetBlocks, nests+1)}`;
                    }
                    return `${space}while not (${condition}):\n` + substack + '\n' + translateBlocks(next, targetBlocks, nests);

                case "control_stop":
                    return `${space}await target.control_stop_async("${fields.STOP_OPTION.value}")`+ '\n' + translateBlocks(next, targetBlocks, nests);

                case "control_create_clone_of":
                    return `${space}target.control_create_clone(${translateBlocks(inputs.CLONE_OPTION.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "control_delete_this_clone":
                    return `${space}target.control_delete_clone()` + '\n' + translateBlocks(next, targetBlocks, nests);

                // Values

                // Additional
                case "control_create_clone_of_menu":
                    return `"${fields.CLONE_OPTION.value}"`;

                // #endregion

                // #region --- SENSING BLOCKS --- 

                // Main
                case "sensing_touchingobject":
                    return `target.sensing_is_touching_object(${translateBlocks(inputs.TOUCHINGOBJECTMENU.block, targetBlocks, nests)})`;

                case "sensing_touchingcolor":
                    return `target.sensing_is_touching_color(${translateBlocks(inputs.COLOR.block, targetBlocks, nests)})`;

                case "sensing_coloristouchingcolor":
                    return `target.sensing_is_color_touching_color(${translateBlocks(inputs.COLOR.block, targetBlocks, nests)}, ${translateBlocks(inputs.COLOR2.block, targetBlocks, nests)})`;

                case "sensing_askandwait":
                    return `${space}await target.sensing_ask_and_wait_async(${translateBlocks(inputs.QUESTION.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "sensing_keypressed":
                    return `target.sensing_is_button_held(${translateBlocks(inputs.KEY_OPTION.block, targetBlocks, nests)})`;

                case "sensing_mousedown":
                    return `target.sensing_is_mouse_held()`;

                case "sensing_setdragmode":
                    return `${space}target.sensing_drag_mode("${fields.DRAG_MODE.value}")` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "sensing_resettimer":
                    return `${space}target.sensing_reset_timer()` + '\n' + translateBlocks(next, targetBlocks, nests);

                // Values
                case "sensing_distanceto":
                    return `target.sensing_distance_to(${translateBlocks(inputs.DISTANCETOMENU.block, targetBlocks, nests)})`;

                case "sensing_answer":
                    return `target.sensing_answer()`;

                case "sensing_mousex":
                    return `target.sensing_mouse_x()`;

                case "sensing_mousey":
                    return `target.sensing_mouse_y()`;

                case "sensing_loudness":
                    return `target.sensing_loudness()`;

                case "sensing_timer":
                    return `target.sensing_timer()`;

                case "sensing_of":
                    return `target.sensing_variable_from("${fields.PROPERTY.value}", ${translateBlocks(inputs.OBJECT.block, targetBlocks, nests)})`;

                case "sensing_current":
                    return `target.sensing_current("${fields.CURRENTMENU.value}")`;

                case "sensing_dayssince2000":
                    return `target.sensing_days_sice_2000()`;

                case "sensing_username":
                    return `target.sensing_username()`;

                // Additional
                case "sensing_touchingobjectmenu":
                    return `"${fields.TOUCHINGOBJECTMENU.value}"`;

                case "sensing_distancetomenu":
                    return `"${fields.DISTANCETOMENU.value}"`;

                case "sensing_keyoptions":
                    return `"${fields.KEY_OPTION.value}"`;

                case "sensing_of_object_menu":
                    return `"${fields.OBJECT.value}"`;

                // #endregion

                // #region --- OPERATORS BLOCKS --- 

                // Main
                case "operator_gt":
                    return `target.operators_greater_than(${translateBlocks(inputs.OPERAND1.block, targetBlocks, nests)}, ${translateBlocks(inputs.OPERAND2.block, targetBlocks, nests)})`;

                case "operator_lt":
                    return `target.operators_less_than(${translateBlocks(inputs.OPERAND1.block, targetBlocks, nests)}, ${translateBlocks(inputs.OPERAND2.block, targetBlocks, nests)})`;

                case "operator_equals":
                    return `target.operators_equals(${translateBlocks(inputs.OPERAND1.block, targetBlocks, nests)}, ${translateBlocks(inputs.OPERAND2.block, targetBlocks, nests)})`;

                case "operator_and":
                    var operand1 = 'False';
                    if('OPERAND1' in inputs && inputs.OPERAND1.block !== null){
                        operand1 = `${translateBlocks(inputs.OPERAND1.block, targetBlocks, nests+1)}`;
                    }
                    var operand2 = 'False';
                    if('OPERAND2' in inputs && inputs.OPERAND2.block !== null){
                        operand2 = `${translateBlocks(inputs.OPERAND2.block, targetBlocks, nests+1)}`;
                    }
                    return `(${operand1} and ${operand2})`;

                case "operator_or":
                    var operand1 = 'False';
                    if('OPERAND1' in inputs && inputs.OPERAND1.block !== null){
                        operand1 = `${translateBlocks(inputs.OPERAND1.block, targetBlocks, nests+1)}`;
                    }
                    var operand2 = 'False';
                    if('OPERAND2' in inputs && inputs.OPERAND2.block !== null){
                        operand2 = `${translateBlocks(inputs.OPERAND2.block, targetBlocks, nests+1)}`;
                    }
                    return `(${operand1} or ${operand2})`;

                case "operator_not":
                    var operand = 'False';
                    if('OPERAND' in inputs && inputs.OPERAND.block !== null){
                        operand = `${translateBlocks(inputs.OPERAND.block, targetBlocks, nests+1)}`;
                    }
                    return `(not ${operand})`;

                case "operator_contains":
                    return `target.operators_contains(${translateBlocks(inputs.STRING1.block, targetBlocks, nests)}, ${translateBlocks(inputs.STRING2.block, targetBlocks, nests)})`;

                // Values
                case "operator_add":
                    return `(${translateBlocks(inputs.NUM1.block, targetBlocks, nests)} + ${translateBlocks(inputs.NUM2.block, targetBlocks, nests)})`;

                case "operator_subtract":
                    return `(${translateBlocks(inputs.NUM1.block, targetBlocks, nests)} - ${translateBlocks(inputs.NUM2.block, targetBlocks, nests)})`;

                case "operator_multiply":
                    return `(${translateBlocks(inputs.NUM1.block, targetBlocks, nests)} * ${translateBlocks(inputs.NUM2.block, targetBlocks, nests)})`;

                case "operator_divide":
                    return `(${translateBlocks(inputs.NUM1.block, targetBlocks, nests)} / ${translateBlocks(inputs.NUM2.block, targetBlocks, nests)})`;

                case "operator_random":
                    return `target.operators_random_number(${translateBlocks(inputs.FROM.block, targetBlocks, nests)}, ${translateBlocks(inputs.TO.block, targetBlocks, nests)})`;

                case "operator_join":
                    return `target.operators_concatenate(${translateBlocks(inputs.STRING1.block, targetBlocks, nests)}, ${translateBlocks(inputs.STRING2.block, targetBlocks, nests)})`;

                case "operator_letter_of":
                    return `target.operators_letter_in(${translateBlocks(inputs.LETTER.block, targetBlocks, nests)}, ${translateBlocks(inputs.STRING.block, targetBlocks, nests)})`;

                case "operator_length":
                    return `target.operators_length(${translateBlocks(inputs.STRING.block, targetBlocks, nests)})`;

                case "operator_mod":
                    return `(${translateBlocks(inputs.NUM1.block, targetBlocks, nests)} % ${translateBlocks(inputs.NUM2.block, targetBlocks, nests)})`;

                case "operator_round":
                    return `target.operators_round(${translateBlocks(inputs.NUM.block, targetBlocks, nests)})`;

                case "operator_mathop":
                    return `target.operators_math_operation_of("${fields.OPERATOR.value}", ${translateBlocks(inputs.NUM.block, targetBlocks, nests)})`;

                // Additional

                // #endregion

                // #region --- VARIABLES BLOCKS --- 

                // Main
                case "data_setvariableto":
                    return `${space}target.variables_set_variable_to("${fields.VARIABLE.id}", ${translateBlocks(inputs.VALUE.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);
                
                case "data_changevariableby":
                    return `${space}target.variables_change_variable_for("${fields.VARIABLE.id}", ${translateBlocks(inputs.VALUE.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);
                
                case "data_showvariable":
                    return `${space}target.variables_show_variable("${fields.VARIABLE.id}")` + '\n' + translateBlocks(next, targetBlocks, nests);
                
                case "data_hidevariable":
                    return `${space}target.variables_hide_variable("${fields.VARIABLE.id}")` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "data_addtolist":
                    return `${space}target.variables_add_element_to_list(${translateBlocks(inputs.ITEM.block, targetBlocks, nests)}, "${fields.LIST.value}")` + '\n' + translateBlocks(next, targetBlocks, nests);
                
                case "data_deleteoflist":
                    return `${space}target.variables_remove_position_from_list(${translateBlocks(inputs.INDEX.block, targetBlocks, nests)}, "${fields.LIST.value}")` + '\n' + translateBlocks(next, targetBlocks, nests);
                
                case "data_deletealloflist":
                    return `${space}target.variables_remove_all_from_list("${fields.LIST.value}")` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "data_insertatlist":
                    return `${space}target.variables_insert_element_at_position_in_list(${translateBlocks(inputs.ITEM.block, targetBlocks, nests)}, ${translateBlocks(inputs.INDEX.block, targetBlocks, nests)}, "${fields.LIST.value}")` + '\n' + translateBlocks(next, targetBlocks, nests);
                
                case "data_replaceitemoflist":
                    return `${space}target.variables_replace_position_in_list_with_element(${translateBlocks(inputs.INDEX.block, targetBlocks, nests)}, "${fields.LIST.value}", ${translateBlocks(inputs.ITEM.block, targetBlocks, nests)})` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "data_listcontainsitem":
                    return `target.variables_list_contains_element("${fields.LIST.value}", ${translateBlocks(inputs.ITEM.block, targetBlocks, nests)})`;
                
                case "data_showlist":
                    return `${space}target.variables_show_list("${fields.LIST.value}")` + '\n' + translateBlocks(next, targetBlocks, nests);

                case "data_hidelist":
                    return `${space}target.variables_hide_list("${fields.LIST.value}")` + '\n' + translateBlocks(next, targetBlocks, nests);

                // Values
                case "data_variable":
                    return `target.variables_value("${fields.VARIABLE.id}")`;

                case "data_listcontents":
                    return `target.variables_value("${fields.LIST.value}")`;

                case "data_itemoflist":
                    return `target.variables_element_at_position_in_list(${translateBlocks(inputs.INDEX.block, targetBlocks, nests)}, "${fields.LIST.value}")`;

                case "data_itemnumoflist":
                    return `target.variables_position_of_element_in_list(${translateBlocks(inputs.ITEM.block, targetBlocks, nests)}, "${fields.LIST.value}")`;

                case "data_lengthoflist":
                    return `target.variables_length_of_list("${fields.LIST.value}")`;

                // Additional

                // #endregion

                // #region --- OTHER BLOCKS --- 

                case "math_number":
                    var value = fields.NUM.value
                    if(value.length == 0){
                        return 0;
                    }else{
                        return value;
                    }

                case "math_angle":
                    return fields.NUM.value;

                case "math_integer":
                    return fields.NUM.value;

                case "math_positive_number":
                    return fields.NUM.value;

                case "math_whole_number":
                    return fields.NUM.value;

                case "text":
                    return `"${fields.TEXT.value}"`;

                case "colour_picker":
                    return `"${fields.COLOUR.value}"`;
                
                // #endregion

                default:
                    return `# Unsupported block: ${opcode}\n`;
            }
        }

        const [backdropNames, currentBackdropIndex, backdropData, stageSoundNames, stageSoundVolume, drawList] = getData();
        let stage = "";
        const sprites = [];
        const subscribers = new Map();
        const scripts = [];
        const targets = this.props.vm.runtime.targets;
        let spriteIndex = 0;
        let scriptIndex = 0;
        for(const target of targets){
            // Get the variables (vars and lists)
            let myVariables = "{";
            let myLists = "{";
            const variables = target.variables;
            for(const variableId in variables){
                const variable = variables[variableId];
                if(variable.type == "list"){
                    myLists += `"${variable.id}": ("${variable.name}", [${variable.value.map(val => `"${val}"`).join(', ')}]), `;
                }else if(typeof variable.value == "string"){
                    myVariables += `"${variable.id}": ("${variable.name}", "${variable.value}"), `;
                }else if(typeof variable.value == "number"){
                    myVariables += `"${variable.id}": ("${variable.name}", ${variable.value}), `;
                }
            }
            myVariables += "}";
            myLists += "}";

            // Create python Sprite object or Stage(stage has -1 as key)
            let sprite = "";
            if(!target.isStage){
                sprite = `Figure(self, ${target.drawableID}, "${target.sprite.name}", ${target.x}, ${target.y}, ${target.direction}, ${convertBool(target.visible)}, ${target.size}, "${target.rotationStyle}", ${convertBool(target.draggable)}, ${myVariables}, ${myLists})`;
                sprites.push(sprite);
                subscribers.set(spriteIndex, new Map());
            }else{
                stage = `Stage(self, ${myVariables}, ${myLists})`;
                subscribers.set(-1, new Map());
            }
            
            // Get blocks that belong to current target
            const [targetBlocks, targetEventBlocks] = getTargetBlocks(target);

            for(const blockId of targetEventBlocks){
                // Create scripts for events and add them to targets - create subscriptions of targets based on events
                let scriptName = `script_${scriptIndex}`;
                const [myScript, scriptContent, eventType] = translateEvent(blockId, targetBlocks, scriptName);

                if(target.isStage){
                    let events = subscribers.get(-1);
                    if(events.has(eventType)){
                        let scripts2 = events.get(eventType);
                        scripts2.push(myScript);
                        events.set(eventType, scripts2);
                    }else{
                        events.set(eventType, [myScript]);
                    }
                }else{
                    let events = subscribers.get(spriteIndex);
                    if(events.has(eventType)){
                        let scripts2 = events.get(eventType);
                        scripts2.push(myScript);
                        events.set(eventType, scripts2);
                    }else{
                        events.set(eventType, [myScript]);
                    }
                }
                
                let fullScript = `async def ${scriptName}(target: Union[Figure, Stage]):\n${scriptContent}`;
                scripts.push(fullScript);

                scriptIndex += 1;
            }
            if(!target.isStage){
                spriteIndex += 1;
            }
        }

        // Convert javascript variables to python variables as strings
        let backdropNamesPy = `[\n${tab.repeat(3)}` + backdropNames.map(item => `"${item}"`).join(`,\n${tab.repeat(3)}`) + `\n${tab.repeat(2)}]`;
        let currentBackdropIndexPy = currentBackdropIndex;
        let backdropRotationCentersPy = `[\n${tab.repeat(3)}` + backdropData.map(([item1, item2, item3, item4]) => `("${item1}", ${item2}, ${item3}, ${item4})`).join(`,\n${tab.repeat(3)}`) + `\n${tab.repeat(2)}]`;
        let stageSoundNamesPy = `[\n${tab.repeat(3)}` + stageSoundNames.map(item => `"${item}"`).join(`,\n${tab.repeat(3)}`) + `\n${tab.repeat(2)}]`;
        let stageSoundVolumePy = stageSoundVolume;
        let drawListPy = `[\n${tab.repeat(3)}` + drawList.map(item => `${item}`).join(`,\n${tab.repeat(3)}`) + `\n${tab.repeat(2)}]`;
        let stagePy = stage;
        let spritesPy = `[\n${tab.repeat(3)}` + sprites.map(item => `${item}`).join(`,\n${tab.repeat(3)}`) + `\n${tab.repeat(2)}]`;
        let subscribersPy = '{\n';
        for (const [index, events] of subscribers) {
            if(index == -1){
                subscribersPy += `${tab.repeat(3)}self.stage: {\n`;
            }else{
                subscribersPy += `${tab.repeat(3)}self.figures[${index}]: {\n`;
            }
            for (const [event, scripts] of events) {
                subscribersPy += `${tab.repeat(4)}${event}: [\n`;
                scripts.forEach((script) => {
                    subscribersPy += `${tab.repeat(5)}${script},\n`;
                });
                subscribersPy += `${tab.repeat(4)}],\n`;
            }
            subscribersPy += `${tab.repeat(3)}},\n`;
        }
        subscribersPy += `${tab.repeat(2)}}`;
        let scriptsPy = scripts.map(item => `${item}`).join(`\n\n`);

        pythonCode = pythonCode.replace("{#stageBackdropNames}", backdropNamesPy);
        pythonCode = pythonCode.replace("{#currentBackdropIndex}", currentBackdropIndexPy);
        pythonCode = pythonCode.replace("{#stageBackdropRotationCenters}", backdropRotationCentersPy);
        pythonCode = pythonCode.replace("{#stageSoundNames}", stageSoundNamesPy);
        pythonCode = pythonCode.replace("{#stageSoundVolume}", stageSoundVolumePy);
        pythonCode = pythonCode.replace("{#drawList}", drawListPy);
        pythonCode = pythonCode.replace("{#stage}", stagePy);
        pythonCode = pythonCode.replace("{#figures}", spritesPy);
        pythonCode = pythonCode.replace("{#scripts}", scriptsPy);
        pythonCode = pythonCode.replace("{#subscribers}", subscribersPy);

        if(this.props.translatedContent === pythonCode){
            // If the translated code is exactly the same as previuously - don't update
            return;
        }

        this.props.onClickTranslateContent(pythonCode);

        // Set status to trasnlated for some seconds, then set status back to empty
        // Clear the previous timer if it exists
        this.props.updateTranslatorStatus("Koda prevedena.");
        if (this.translatorStatusTimer) {
            clearTimeout(this.translatorStatusTimer);
        }
        // Set a new timer
        this.translatorStatusTimer = setTimeout(() => {
            this.props.updateTranslatorStatus("");
        }, 4000);
    }

    // render to scene
    render () {
        return (
            <div
                className={classNames(
                    styles.translatorPane
                )}
            >
                <PythonTranslatorHeader
                    /* send functions as props for children to use */
                    onClickCloseTranslator={this.handleClickCloseTranslator}
                    onClickTranslateContent={this.handleClickTranslate}
                    onClickCopyContent={this.handleClickCopyContent}
                />
        
                <PythonTranslatorContent
                    ref={this.textareaRef} 
                    translatedContent={this.props.translatedContent}
                />

                <p
                    className={classNames(
                        styles.translatorStatus
                )}
                >Status: <span>{this.props.translatorStatus}</span></p>
            </div>
        )
    }
}

// types of all the props that arrive from parent component and current component props
PythonTranslator.propTypes = {
    translatedContent: PropTypes.string,
    translatorStatus: PropTypes.string,
    isTranslatorOpened: PropTypes.bool,
    onClickCloseTranslator: PropTypes.func,
    onClickTranslateContent: PropTypes.func,
    onClickCopyContent: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
}

PythonTranslator.defaultProps = {
    translatedContent: '',
    translatorStatus: ''
};

// maps values from states to props, so they can be accessed
const mapStateToProps = (state, ownProps) => {
    return {
        isTranslatorOpened: getIsTranslatorOpened(state),
        translatedContent: getTranslatedContent(state),
        translatorStatus: getTranslatorStatus(state),
        textareaScrollPos: getTextareaScrollPos(state),
        vm: state.scratchGui.vm
    };
};

// maps dispatch functions from reducers to props, so they can be called from here
const mapDispatchToProps = dispatch => ({
    onClickCloseTranslator: () => dispatch(closeTranslator()),
    onClickTranslateContent: (content) => dispatch(setTranslatedContent(content)),
    updateTranslatorStatus: (content) => dispatch(setTranslatorStatus(content)),
    updateTextareaScrollPos: (content) => dispatch(setTextareaScrollPos(content))
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(PythonTranslator);
