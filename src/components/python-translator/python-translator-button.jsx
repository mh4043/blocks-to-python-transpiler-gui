import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';

import styles from './python-translator-button.css';
import pythonTranslatorIcon from './icon--python-translator.png'

const PythonTranslatorButton = ({
    className,
    isTranslatorOpened,
    onClick
}) => (
    <Button
        className={classNames(
            className,
            {[styles.pythonTranslatorButtonIsOpened]: isTranslatorOpened}
        )}
        iconSrc={pythonTranslatorIcon}
        iconClassName={styles.pythonTranslatorIcon}
        onClick={onClick}
    >
    </Button>
);

PythonTranslatorButton.propTypes = {
    className: PropTypes.string,
    isTranslatorOpened: PropTypes.bool,
    onClick: PropTypes.func
};

PythonTranslatorButton.defaultProps = {
    onClick: () => {}
};

export default PythonTranslatorButton;