/*
import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {intlShape, injectIntl} from 'react-intl';

import {
    getIsTranslatorOpened,
    openCloseTranslator,
    closeTranslator
} from '../reducers/python-translator';

import PythonTranslatorComponent from '../components/python-translator/python-translator.jsx';

class PythonTranslator extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleCloseTranslator'
        ]);
    }

    handleCloseTranslator () {

    }

    render () {
        const {
            ...componentProps
        } = this.props;

        return (
            <PythonTranslatorComponent
                {...componentProps}
                onCloseTranslator={this.handleCloseTranslator}
            />
        );
    }
}

const {
    ...pythonTranslatorProps
} = PythonTranslatorComponent.propTypes;

PythonTranslator.propTypes = {
    ...pythonTranslatorProps
};

const mapStateToProps = state => ({
    isTranslatorOpened
});

const mapDispatchToProps = dispatch => ({

});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(PythonTranslator));
*/