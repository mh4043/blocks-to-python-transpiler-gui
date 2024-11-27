import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';

import styles from './python-translator-button-copy.css';
import stylesMenu from '../menu-bar/menu-bar.css';
import pythonTranslatorCopyIcon from './icon--python-translator-copy.png'

// We get the following props from parent component
const PythonTranslatorButtonCopy = ({
    className,
    onClick
}) => (
    <Button
        className={classNames(
            stylesMenu.menuBarItem, 
            stylesMenu.hoverable,
            styles.button
        )}
        iconSrc={pythonTranslatorCopyIcon}
        iconClassName={styles.pythonTranslatorCopyIcon}
        onClick={onClick}
    >
    </Button>
);

PythonTranslatorButtonCopy.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func
};

PythonTranslatorButtonCopy.defaultProps = {
    onClick: () => {}
};

export default PythonTranslatorButtonCopy;