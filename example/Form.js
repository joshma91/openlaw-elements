// @flow

import React, { Component, Fragment } from 'react';
import { Openlaw } from 'openlaw';

/**
 * DO NOT DIRECTLY COPY the lines below;
 *
 * If your app is bundled and using our `esm/ lib,
 * in your app they will become:
 *   import OpenLawForm from 'openlaw-elements';
 *   import 'openlaw-elements/dist/esm/openlaw-elements.min.css';
 */
import OpenLawForm from '../src';
// $FlowFixMe
import '../src/style.scss';

import { apiClientSingleton } from './auth';
import SectionsRenderer from './SectionsRenderer';
import SampleTemplateText from './SAMPLE_TEMPLATE';
import getExternalCallStructures from './externalCallStructuresHelper.js';
import type { FieldErrorType } from '../src/flowTypes';

type Props = {
  stateLifter: (State) => void,
};

type State = {
  executionResult: { [string]: any },
  parameters: { [string]: any },
  variables: Array<{ [string]: any }>,
};

/**
* Examples of custom validation
*
* Return an errorMessage key to provide your own
* or override & hide a validation error with an empty string.
*
* You can also call your other validation handlers, etc. inside here.
*/
const onValidate = (validationResult) => {
  // show custom error message if name is incorrect on blur event
  if (
    validationResult.elementType === 'Text'
    && validationResult.eventType === 'blur'
    && validationResult.elementName === 'Contestant-Name'
    && validationResult.value !== 'Smoky'
  ) {
    return {
      errorMessage: 'Please, only participants with the name "Smoky" can enter.',
    };
  }

  // show custom error message if file name is incorrect
  if (
    validationResult.elementName === 'Contestant-Picture'
    && validationResult.value.file
    && !validationResult.value.file.name.includes('smoky-with-beer')
  ) {
    return {
      errorMessage: 'Please upload a file with a name that includes "smoky-with-beer"',
    };
  }
};

/**
* Form
*
* NOTE: It's recommended to use a Class component as it's easier to use instance methods
* as props for on[Event] functions which do not cause unnecessary PureComponent rendering farther down.
* InputRenderer caches (and updates if changed) other props where necessary (e.g. inputProps).
*/
class Form extends Component<Props, State> {
  // set some initial state values
  compiledTemplate = Openlaw.compileTemplate(SampleTemplateText).compiledTemplate;
  initialExecutionResult = Openlaw.execute(this.compiledTemplate, {}, {}, getExternalCallStructures()).executionResult;
  initialVariables = Openlaw.getExecutedVariables(this.initialExecutionResult, {});
  inputExtraTextMap = {
    'Favorite Meats *': () =>
      <small>Don&rsquo;t be afraid to eat meat 🍖.</small>,
    'Certifier Eth Address': () =>
      <small>If you don&rsquo;t know it, then whatever.</small>,
    'Certification List': () =>
      <small>Don&rsquo;t be afraid to toot your 🎺.</small>,
    'Contestant Name': () =>
      <small>We&rsquo;re picky with names.</small>,
    'Contestant BBQ Region': () =>
      <small>Regions <i>Moon</i>, <i>ISS</i> and <i>Mars</i> coming soon! 🛰</small>,
    'Contestant Address': () =>
      <small>We always spam the old-fashioned, American way.</small>
  };

  state = {
    executionResult: this.initialExecutionResult,
    parameters: {},
    variables: this.initialVariables,
  };

  componentDidMount() {
    this.props.stateLifter(this.state);
  }

  onElementChange = (key: string, value: string, validationResult: FieldErrorType) => {
    const { parameters } = this.state;
    // value needs to be unset, and the current paramter value is not already unset
    const shouldSetNewValue = 
      (value === undefined && parameters[key] !== undefined)
        ? true
        // things are looking reallllly good
        : (!validationResult.isError && value !== parameters[key])
        ? true
        // default
        : false;

    if (!shouldSetNewValue) return;

    const { stateLifter } = this.props;

    const mergedParameters = { ...parameters, [key]: value };
    const { executionResult, errorMessage } = Openlaw.execute(this.compiledTemplate, {}, mergedParameters, getExternalCallStructures());

    if (errorMessage) {
      // eslint-disable-next-line no-undef
      console.error('Openlaw Execution Error:', errorMessage);
      return;
    }

    this.setState({
      executionResult,
      parameters: mergedParameters,
      variables: Openlaw.getExecutedVariables(executionResult, {}),
    }, () => {
      stateLifter(this.state);
    });
  };
  
  render() {
    const { executionResult, parameters, variables } = this.state;

    return (
      <Fragment>
        {Object.keys(executionResult).length && (
          <OpenLawForm
            apiClient={apiClientSingleton}
            executionResult={executionResult}
            inputExtraTextMap={this.inputExtraTextMap}
            parameters={parameters}
            onChangeFunction={this.onElementChange}
            onValidate={onValidate}
            openLaw={Openlaw}
            renderSections={SectionsRenderer}
            sectionTransform={(sectionName: string, index: number) => {
              // Transform & shape your custom sections here!
              // See <SectionsRenderer /> for usage.
              return {
                section: sectionName,
                mySuperCustomKey: `${index + 1}. `,
                index,
              };
            }}
            unsectionedTitle="" // none, don't create a section
            variables={variables}
          />
        )}
      </Fragment>
    );
  }
}

export default Form;
