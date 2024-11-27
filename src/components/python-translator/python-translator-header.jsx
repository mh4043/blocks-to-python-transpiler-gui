import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './python-translator-header.css';
import PythonTranslatorButtonClose from './python-translator-button-close';
import PythonTranslatorButtonTranslate from './python-translator-button-translate';
import PythonTranslatorButtonCopy from './python-translator-button-copy';

// We get the following props from parent component
const PythonTranslatorHeader = ({
    className,
    onClickCloseTranslator,
    onClickTranslateContent,
    onClickCopyContent
}) => (
    <div 
        className={classNames(
            styles.translatorHeader
        )}
    >
        <div 
            className={classNames(
                styles.leftSide
            )}
        >
            <h4>Scratch &rarr; Python prevajalnik</h4>
            <p>*Podprti vsi osnovni bloki razen slikovnih (delno) in zvočnih učinkov.</p>
        </div>
        <div 
            className={classNames(
                styles.rightSide
            )}
        >
            <div className={styles.buttonGroup}>
                <PythonTranslatorButtonTranslate 
                    onClick={onClickTranslateContent}
                />
                <PythonTranslatorButtonCopy 
                    onClick={onClickCopyContent}
                />
                <PythonTranslatorButtonClose 
                    onClick={onClickCloseTranslator}
                />
            </div>
        </div>
    </div>
);

PythonTranslatorHeader.propTypes = {
    className: PropTypes.string,
    onClickCloseTranslator: PropTypes.func,
    onClickTranslate: PropTypes.func,
    onClickCopyContent: PropTypes.func
};

PythonTranslatorHeader.defaultProps = {
    
};

export default PythonTranslatorHeader;
