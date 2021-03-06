import * as ora from 'ora';

export default ora.default;

export type OraCallback<T, R> = (arg: T) => R;

interface OraOptions {
  text: string;
  isEnabled?: boolean;
}

/**
 * Added for testing purposes
 * @param title
 */
/* istanbul ignore next */
export const _getSpinner = (text: string) => {
  const options: OraOptions = { text };
  if (process.env.DEBUG || process.env.TRACE) {
    options.isEnabled = false;
  }

  return ora.default(options);
};

/**
 * Am {@link ora} progress wrapper
 *
 * @param title     the title to show
 * @param callback  the callback to run
 */
export const progress = async <R>(title: string, callback: OraCallback<ora.Ora, any>): Promise<R> => {
  const spinner = _getSpinner(title);

  try {
    spinner.start();
    const response = await callback(spinner);
    spinner.succeed();

    return response;
  } catch (e) {
    spinner.fail(e.message);

    throw e;
  }
};
