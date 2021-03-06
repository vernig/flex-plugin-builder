import fs from 'fs';
import { Configuration, SourceMapDevToolPlugin } from 'webpack';
import CleanWebpackPlugin from 'clean-webpack-plugin';

import * as utilsFs from '../../utils/fs';

jest.mock('path', () => ({
  join: (...args: string[]) => args.includes('@twilio/flex-ui') ? 'flex-ui' : 'app',
}));

jest.mock('fs');
fs.readFileSync = jest.fn().mockImplementation((path: string) => {
  if (path === 'flex-ui') {
    return '{"version":"1.2.3"}';
  } else {
    return '{"name":"app-name"}';
  }
});

describe('webpack', () => {
  const getConfig = (opts = {}) => require('../webpack').default.configure(opts);

  it('should have all the required fields', () => {
    const config = getConfig();

    expect(config).toHaveProperty('output');
    expect(config).toHaveProperty('plugins');
    expect(config).toHaveProperty('optimization');
    expect(config).toHaveProperty('resolve');
  });

  it('should check output property', () => {
    const config = getConfig();

    expect(config.output.filename).toEqual('app-name.js');
    expect(config.output.chunkFilename).toEqual('[name].chunk.js');
  });

  it('should check externals', () => {
    const config = getConfig();

    expect(config.externals).toHaveProperty('react');
    expect(config.externals).toHaveProperty('react-dom');
    expect(config.externals).toHaveProperty('redux');
    expect(config.externals).toHaveProperty('react-redux');
  });

  it('should check plugins', () => {
    const config = getConfig();

    expect(config.plugins).toHaveLength(2);
    expect(config.plugins[0]).toBeInstanceOf(CleanWebpackPlugin);
    expect(config.plugins[1]).toBeInstanceOf(SourceMapDevToolPlugin);
  });

  it('check optimization', () => {
    const config = getConfig();

    expect(config.optimization.splitChunks).toBeFalsy();
    expect(config.optimization.runtimeChunk).toBeFalsy();
  });

  it('should check alias', () => {
    const config = getConfig();

    expect(config.resolve.alias).toHaveProperty('@twilio/flex-ui');
    expect(config.resolve.alias['@twilio/flex-ui']).toEqual('flex-plugin-scripts/dev_assets/flex-shim.js');
  });

  it('should load custom config', () => {
    const loadFile = jest
      .spyOn(utilsFs, 'loadFile')
      .mockReturnValue({
        name: 'foo',
        devServer: { public: 'bar' },
      });

    const config = getConfig();

    expect(config.name).toEqual('foo');
    expect(config).not.toHaveProperty('devServer');

    loadFile.mockRestore();
  });

  it('should filter out unsupported plugins', () => {
    const plugins = [
      { constructor: { name: 'SWPrecacheWebpackPlugin' }},
      { constructor: { name: 'ManifestPlugin' }},
    ];

    const config = getConfig({ plugins });

    expect(config.plugins).toHaveLength(2);
    expect(config.plugins[0]).toBeInstanceOf(CleanWebpackPlugin);
    expect(config.plugins[1]).toBeInstanceOf(SourceMapDevToolPlugin);
  });

  it('should update HtmlWebpackPlugin plugin', () => {
    const plugin = {
      constructor: { name: 'HtmlWebpackPlugin' },
      options: {
        inject: true,
        hash: true,
      },
    };

    const config = getConfig({plugins: [plugin]});

    expect(config.plugins).toHaveLength(3);
    expect(config.plugins[0].options.inject).toEqual(false);
    expect(config.plugins[0].options.hash).toEqual(false);
    expect(config.plugins[1]).toBeInstanceOf(CleanWebpackPlugin);
    expect(config.plugins[2]).toBeInstanceOf(SourceMapDevToolPlugin);
  });

  it('should update InterpolateHtmlPlugin plugin', () => {
    const plugin = {
      constructor: { name: 'InterpolateHtmlPlugin' },
    };

    const config = getConfig({plugins: [plugin]});

    expect(config.plugins).toHaveLength(3);
    expect(config.plugins[0].replacements).toHaveProperty('TWILIO_FLEX_VERSION');
    expect(config.plugins[0].replacements.TWILIO_FLEX_VERSION).toEqual('1.2.3');
    expect(config.plugins[1]).toBeInstanceOf(CleanWebpackPlugin);
    expect(config.plugins[2]).toBeInstanceOf(SourceMapDevToolPlugin);
  });
});
