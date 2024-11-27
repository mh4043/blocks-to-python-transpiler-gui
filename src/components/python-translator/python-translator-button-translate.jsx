import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';

import styles from './python-translator-button-translate.css';
import stylesMenu from '../menu-bar/menu-bar.css';
import pythonTranslatorTranslateIcon from './icon--python-translator-translate.png'

const PythonTranslatorButtonTranslate = ({
    className,
    onClick
}) => (
    <Button
        className={classNames(
            stylesMenu.menuBarItem, 
            stylesMenu.hoverable,
            styles.button
        )}
        iconSrc={pythonTranslatorTranslateIcon}
        iconClassName={styles.pythonTranslatorTranslateIcon}
        onClick={onClick}
    >
    </Button>
);

PythonTranslatorButtonTranslate.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func
};

PythonTranslatorButtonTranslate.defaultProps = {
    onClick: () => {}
};

export default PythonTranslatorButtonTranslate;