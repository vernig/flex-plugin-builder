import { AuthConfig } from 'flex-dev-utils/dist/keytar';

import BaseClient from './baseClient';
import { Build, BuildStatus } from './serverless-types';
import ServiceClient from './services';

export interface BuildData {
  FunctionVersions: string[];
  AssetVersions: string[];
  Dependencies: object;
}

export default class BuildClient extends BaseClient {
  private static timeoutMsec: number = 60000;
  private static pollingIntervalMsec: number = 500;

  constructor(auth: AuthConfig, serviceSid: string) {
    super(auth,  `${ServiceClient.getBaseUrl()}/Services/${serviceSid}`);
  }

  /**
   * Creates a new {@link Build} and then polls the endpoint once a second until the build is
   * complete.
   *
   * @param data  the build data
   */
  public create = (data: BuildData): Promise<Build> => {
    return new Promise(async (resolve, reject) => {
      const newBuild = await this._create(data);
      const sid = newBuild.sid;

      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        reject('Timeout while waiting for new Twilio Runtime build status to change to complete.');
      }, BuildClient.timeoutMsec);

      const intervalId = setInterval(async () => {
        const build = await this.get(sid);

        if (build.status === BuildStatus.Failed) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);

          reject('New Twilio Runtime build has failed.');
        }

        if (build.status === BuildStatus.Completed) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          resolve(build);
        }
      }, BuildClient.pollingIntervalMsec);
    });
  }

  /**
   * Fetches a build by buildSid
   *
   * @param buildSid  the build sid to fetch
   */
  public get = (buildSid: string): Promise<Build> => {
    return this.http
      .get<Build>(`Builds/${buildSid}`);
  }

  /**
   * Creates a new instance of build
   *
   * @param data  the build data
   * @private
   */
  private _create = (data: BuildData): Promise<Build> => {
    return this.http
      .post<Build>('Builds', data);
  }
}
