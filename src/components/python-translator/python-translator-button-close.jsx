import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';

import styles from './python-translator-button-close.css';
import stylesMenu from '../menu-bar/menu-bar.css';
import pythonTranslatorCloseIcon from './icon--python-translator-close.png'

const PythonTranslatorButtonClose = ({
    className,
    onClick
}) => (
    <Button
        className={classNames(
            stylesMenu.menuBarItem, 
            stylesMenu.hoverable,
            styles.button
        )}
        iconSrc={pythonTranslatorCloseIcon}
        iconClassName={styles.pythonTranslatorCloseIcon}
        onClick={onClick}
    >
    </Button>
);

PythonTranslatorButtonClose.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func
};

PythonTranslatorButtonClose.defaultProps = {
    onClick: () => {}
};

export default PythonTranslatorButtonClose;