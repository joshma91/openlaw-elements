import React, { useState } from 'react';
import { act } from 'react-dom/test-utils';
import {
  cleanup,
  fireEvent,
  render,
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Openlaw } from 'openlaw';

import { ImageInput } from '../ImageInput';
import openlawLogoBase64 from '../__mocks__/testImage.js';
import { CSS_CLASS_NAMES } from '../constants';
import TestOpenLawFormComponent from '../__test_utils__/OpenLawFormComponent';
import { getTemplateExecutionData, getValidity as testGetValidity } from '../__test_utils__/helpers';

const template = 'Contestant Awesome Face:\
  [[Contestant Picture: Image]]';
const getValidity = testGetValidity(
  getTemplateExecutionData(template),
);

const base64ToArrayBuffer = base64 => {
  const binaryString =  window.atob(base64);
  const len = binaryString.length;
  // eslint-disable-next-line no-undef
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++)        {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
const file = [base64ToArrayBuffer(openlawLogoBase64)];
const tinyBase64ImgValue =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNM' +
  's+9AAAAFUlEQVR42mNkYPhfz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC';

beforeAll(() => {
  // this is so we can call onload, as it never gets fired in jsdom
  // see: https://github.com/jsdom/jsdom/issues/1816
  Object.defineProperty(global.Image.prototype, 'src', {
    set() {
      this.onload();
    },
  });
});

afterEach(cleanup);

test('Can render', () => {
  const { getByLabelText } = render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      name="Contestant Picture"
      onChange={() => {}}
      openLaw={Openlaw}
      savedValue=""
    />
  );

  getByLabelText(/select contestant picture/i);
});

test('Can render with savedValue', () => {
  const { getByText } = render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      name="Contestant Picture"
      onChange={() => {}}
      onKeyUp={() => {}}
      openLaw={Openlaw}
      savedValue={tinyBase64ImgValue}
    />
  );

  getByText(/edit contestant picture/i);
  expect(getByText(/edit contestant picture/i).disabled).toBeFalsy();
});

test('Can render user-provided extra text string', () => {
  const { getByText } = render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      inputExtraText="Contestant Picture extra text"
      name="Contestant Picture"
      onChange={() => {}}
      openLaw={Openlaw}
      savedValue=""
    />
  );

  getByText(/contestant picture extra text/i);
});

test('Can disable edit button if input is disabled via inputProps', () => {
  const { getByText } = render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      inputProps={{
        disabled: true,
      }}
      name="Contestant Picture"
      onChange={() => {}}
      onKeyUp={() => {}}
      openLaw={Openlaw}
      savedValue={tinyBase64ImgValue}
    />
  );

  getByText(/edit contestant picture/i);
  expect(getByText(/edit contestant picture/i).disabled).toBe(true);
});

test('Can disable edit handler if input is disabled', () => {
  // disabled via inputProps
  const { getByText } = render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      inputProps={{
        disabled: true,
      }}
      name="Contestant Picture"
      onChange={() => {}}
      onKeyUp={() => {}}
      openLaw={Openlaw}
      savedValue={tinyBase64ImgValue}
    />
  );

  fireEvent.click(getByText(/edit contestant picture/i));

  // should not show modal
  expect(() => getByText(/save/i)).toThrow();

  cleanup();

  // disabled via remote image
  const secondRender = render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      name="Contestant Picture"
      onChange={() => {}}
      onKeyUp={() => {}}
      openLaw={Openlaw}
      savedValue="https://openlaw-website.netlify.com/ol-logo-full.png"
    />
  );

  fireEvent.click(secondRender.getByText(/edit contestant picture/i));

  // should not show modal
  expect(() => secondRender.getByText(/save/i)).toThrow();
});

test('Can render with savedValue which is a remote image and disable edit button', () => {
  const { getByText } = render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      name="Contestant Picture"
      onChange={() => {}}
      onKeyUp={() => {}}
      openLaw={Openlaw}
      savedValue="https://openlaw-website.netlify.com/ol-logo-full.png"
    />
  );

  getByText(/edit contestant picture/i);
  expect(getByText(/edit contestant picture/i).disabled).toBe(true);
});

test('Can render with savedValue and open edit dialog', () => {
  const { getByText } = render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      name="Contestant Picture"
      onChange={() => {}}
      onKeyUp={() => {}}
      openLaw={Openlaw}
      savedValue={tinyBase64ImgValue}
    />
  );

  getByText(/edit contestant picture/i);

  fireEvent.click(getByText(/edit contestant picture/i));
  
  getByText(/save/i);
  getByText(/delete/i);
  getByText(/cancel/i);
});

test('Can save an image', async () => {
  function FakeApp() {
    const [ img, saveImg ] = useState('');

    return (
      <ImageInput
        cleanName="Contestant-Picture"
        description="Contestant Picture"
        getValidity={getValidity}
        name="Contestant Picture"
        onChange={(name, value) => {
          // value should be `undefined`
          act(() => { saveImg(value); });
        }}
        onKeyUp={() => {}}
        openLaw={Openlaw}
        savedValue={img}
      />
    );
  }

  const { getByText } = render(
    <FakeApp />
  );

  fireEvent.change(
    document.querySelector('input[type="file"]'),
    {
      target: {
        // eslint-disable-next-line no-undef
        files: [new File(file, 'logo.png', { type: 'image/png' })],
      },
    },
  );
  
  await new Promise(r => { setTimeout(r, 50); });

  fireEvent.click(getByText(/save/i));

  await new Promise(r => { setTimeout(r); });

  getByText(/edit contestant picture/i);
});

test('Can delete a savedValue', async () => {
  function FakeApp() {
    const [ img, deleteImg ] = useState(tinyBase64ImgValue);

    return (
      <ImageInput
        cleanName="Contestant-Picture"
        description="Contestant Picture"
        getValidity={getValidity}
        name="Contestant Picture"
        onChange={(name, value) => {
          // value should be `undefined`
          act(() => { deleteImg(value); });
        }}
        onKeyUp={() => {}}
        openLaw={Openlaw}
        savedValue={img || ''}
      />
    );
  }

  const { getByText, getByLabelText } = render(
    <FakeApp />
  );

  getByText(/edit contestant picture/i);

  fireEvent.click(getByText(/edit contestant picture/i));
  fireEvent.click(getByText(/delete/i));

  await new Promise(r => { setTimeout(r); });

  getByLabelText(/select contestant picture/i);
});

test('Can call onValidate onChange', async () => {
  const onValidateSpy = jest.fn();

  render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      name="Contestant Picture"
      onChange={() => {}}
      onKeyUp={() => {}}
      onValidate={onValidateSpy}
      openLaw={Openlaw}
      savedValue=""
      variableType="Image"
    />
  );

  fireEvent.change(
    document.querySelector('input[type="file"]'),
    {
      target: {
        // eslint-disable-next-line no-undef
        files: [new File(file, 'logo.png', { type: 'image/png' })],
      },
    },
  );
  
  await new Promise(r => { setTimeout(r, 50); });

  const call = onValidateSpy.mock.calls[0];
  expect(call.length).toBe(1);
  expect(call[0].eventType).toBe('change');
  expect(call[0].errorMessage).toBe('');
  expect(call[0].value.file.name).toBe('logo.png');
  expect(call[0].value.file.size > 0).toBe(true);
});

test('Can show user-provided error message onValidate (change)', async () => {
  const { getByText } = render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      name="Contestant Picture"
      onChange={() => {}}
      onKeyUp={() => {}}
      onValidate={({ value }) => {
        if (value.file.size) {
          return {
            errorMessage: 'This is a custom Image error',
          };
        }
      }}
      openLaw={Openlaw}
      savedValue=""
      variableType="Image"
    />
  );

  fireEvent.change(
    document.querySelector('input[type="file"]'),
    {
      target: {
        // eslint-disable-next-line no-undef
        files: [new File(file, 'logo.png', { type: 'image/png' })],
      },
    },
  );
  
  await new Promise(r => { setTimeout(r, 50); });

  getByText(/this is a custom image error/i);
});

test('Can show user-provided error message on save', async () => {
  function FakeApp() {
    const [ img, saveImg ] = useState('');

    return (
      <ImageInput
        cleanName="Contestant-Picture"
        description="Contestant Picture"
        getValidity={getValidity}
        name="Contestant Picture"
        onChange={(name, value) => {
          // value should be `undefined`
          act(() => { saveImg(value); });
        }}
        onKeyUp={() => {}}
        onValidate={() => {
          return {
            errorMessage: 'Please provide an image',
          };
        }}
        openLaw={Openlaw}
        savedValue={img}
      />
    );
  }

  const { getByText } = render(
    <FakeApp />
  );

  fireEvent.change(
    document.querySelector('input[type="file"]'),
    {
      target: {
        // eslint-disable-next-line no-undef
        files: [new File(file, 'logo.png', { type: 'image/png' })],
      },
    },
  );
  
  await new Promise(r => { setTimeout(r, 50); });

  fireEvent.click(getByText(/save/i));

  await new Promise(r => { setTimeout(r); });

  getByText(/please provide an image/i);
});

test('Can show user-provided error message on cancel', async () => {
  const { getByText } = render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      name="Contestant Picture"
      onChange={() => {}}
      onKeyUp={() => {}}
      onValidate={({ value }) => {
        if (!value.file) {
          return {
            errorMessage: 'Please provide an image',
          };
        }
      }}
      openLaw={Openlaw}
      savedValue=""
      variableType="Image"
    />
  );

  fireEvent.change(
    document.querySelector('input[type="file"]'),
    {
      target: {
        // eslint-disable-next-line no-undef
        files: [new File(file, 'logo.png', { type: 'image/png' })],
      },
    },
  );
  
  await new Promise(r => { setTimeout(r, 50); });

  fireEvent.click(getByText(/cancel/i));

  getByText(/please provide an image/i);
});

test('Can hide error message on save via user-provided empty string', async () => {
  function FakeApp() {
    const [ img, saveImg ] = useState('');

    return (
      <ImageInput
        cleanName="Contestant-Picture"
        description="Contestant Picture"
        getValidity={getValidity}
        name="Contestant Picture"
        onChange={(name, value) => {
          // value should be `undefined`
          act(() => { saveImg(value); });
        }}
        onKeyUp={() => {}}
        onValidate={() => {
          return {
            errorMessage: '',
          };
        }}
        openLaw={Openlaw}
        savedValue={img}
      />
    );
  }

  const { getByText } = render(
    <FakeApp />
  );

  fireEvent.change(
    document.querySelector('input[type="file"]'),
    {
      target: {
        // eslint-disable-next-line no-undef
        files: [new File(file, 'logo.png', { type: 'image/png' })],
      },
    },
  );
  
  await new Promise(r => { setTimeout(r, 50); });

  fireEvent.click(getByText(/save/i));

  await new Promise(r => { setTimeout(r); });

  expect(document.querySelector(`.${CSS_CLASS_NAMES.fieldErrorMessage}`)).toBeNull();
});

test('Can hide error message on change via user-provided empty string', async () => {
  const { getByText } = render(
    <ImageInput
      cleanName="Contestant-Picture"
      description="Contestant Picture"
      getValidity={getValidity}
      name="Contestant Picture"
      onChange={() => {}}
      onKeyUp={() => {}}
      onValidate={({ value }) => {
        if (!value) {
          return {
            errorMessage: '',
          };
        }
      }}
      openLaw={Openlaw}
      savedValue=""
      variableType="Image"
    />
  );

  fireEvent.change(
    document.querySelector('input[type="file"]'),
    {
      target: {
        // eslint-disable-next-line no-undef
        files: [new File(file, 'logo.png', { type: 'image/png' })],
      },
    },
  );
  
  await new Promise(r => { setTimeout(r, 50); });

  fireEvent.click(getByText(/cancel/i));

  expect(document.querySelector(`.${CSS_CLASS_NAMES.fieldErrorMessage}`)).toBeNull();
});

test('Can show user-provided error message on delete', async () => {
  function FakeApp() {
    const [ img, deleteImg ] = useState(tinyBase64ImgValue);

    return (
      <ImageInput
        cleanName="Contestant-Picture"
        description="Contestant Picture"
        getValidity={getValidity}
        name="Contestant Picture"
        onChange={(name, value) => {
          // value should be `undefined`
          act(() => { deleteImg(value); });
        }}
        onKeyUp={() => {}}
        onValidate={({ value }) => {
          if (!value.file) {
            return {
              errorMessage: 'Please provide an image',
            };
          }
        }}
        openLaw={Openlaw}
        savedValue={img || ''}
        variableType="Image"
      />
    );
  }

  const { getByText } = render(
    <FakeApp />
  );

  fireEvent.click(getByText(/edit contestant picture/i));
  fireEvent.click(getByText(/delete/i));

  await new Promise(r => { setTimeout(r); });

  getByText(/please provide an image/i);
});

test('Can hide error message on delete via user-provided empty string', async () => {
  function FakeApp() {
    const [ img, deleteImg ] = useState(tinyBase64ImgValue);

    return (
      <ImageInput
        cleanName="Contestant-Picture"
        description="Contestant Picture"
        getValidity={getValidity}
        name="Contestant Picture"
        onChange={(name, value) => {
          // value should be `undefined`
          act(() => { deleteImg(value); });
        }}
        onKeyUp={() => {}}
        onValidate={({ value }) => {
          if (!value) {
            return {
              errorMessage: '',
            };
          }
        }}
        openLaw={Openlaw}
        savedValue={img || ''}
        variableType="Image"
      />
    );
  }

  const { getByText } = render(
    <FakeApp />
  );

  fireEvent.click(getByText(/edit contestant picture/i));
  fireEvent.click(getByText(/delete/i));

  await new Promise(r => { setTimeout(r); });

  expect(document.querySelector(`.${CSS_CLASS_NAMES.fieldErrorMessage}`)).toBeNull();
});

test('Can call onChangeFunction', async () => {
  const changeSpy = jest.fn();

  const { getByText } = render(
    <TestOpenLawFormComponent
      onChangeFunction={changeSpy}
    />
  );

  fireEvent.change(
    document.querySelector('input[type="file"]'),
    {
      target: {
        // eslint-disable-next-line no-undef
        files: [new File(file, 'logo.png', { type: 'image/png' })],
      },
    },
  );
  
  await new Promise(r => { setTimeout(r, 50); });

  fireEvent.click(getByText(/save/i));

  await new Promise(r => { setTimeout(r); });

  expect(changeSpy.mock.calls[0][0]).toMatch(/contestant picture/i);
  expect(changeSpy.mock.calls[0][1]).toContain('data:image/png;');
});

test('Can call inputProps: onChange, onBlur', async () => {
  const changeSpy = jest.fn();
  const blurSpy = jest.fn();

  const { getByText } = render(
    <TestOpenLawFormComponent
      inputProps={{
        'Image': {
          onBlur: blurSpy,
          onChange: changeSpy,
        }
      }}
    />
  );

  fireEvent.change(
    document.querySelector('input[type="file"]'),
    {
      target: {
        // eslint-disable-next-line no-undef
        files: [new File(file, 'logo.png', { type: 'image/png' })],
      },
    },
  );
  
  await new Promise(r => { setTimeout(r, 50); });

  fireEvent.click(getByText(/save/i));

  await new Promise(r => { setTimeout(r); });
  
  fireEvent.blur(document.querySelector('input[type="file"]'));

  expect(changeSpy.mock.calls.length).toBe(1);
  expect(blurSpy.mock.calls.length).toBe(1);
});
