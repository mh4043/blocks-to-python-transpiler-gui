import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './python-translator-content.css';

const PythonTranslatorContent = React.forwardRef (({
    className,
    translatedContent
}, ref
) => (
    <div
        className={classNames(
            styles.translatorContent
        )}
    >
        <textarea
            ref={ref}
            className={classNames(
                styles.translatorContentTextarea
            )}
            readOnly
            value={translatedContent}
        >
        </textarea>
    </div>
));

PythonTranslatorContent.propTypes = {
    className: PropTypes.string,
    translatedContent: PropTypes.string
};

PythonTranslatorContent.defaultProps = {

};

export default PythonTranslatorContent;