/**
 * Base Provider interface
 * Each platform/media type implements analyze() and buildDownloadArgs()
 */

class BaseProvider {
  constructor(id) {
    this.id = id;
  }

  /**
   * @param {string} url
   * @returns {Promise<object>} normalized media info
   */
  async analyze(url) {
    throw new Error(`analyze() not implemented for provider ${this.id}`);
  }

  /**
   * Build yt-dlp / download CLI args for this provider
   * @returns {string[]}
   */
  buildDownloadArgs(url, options = {}) {
    throw new Error(`buildDownloadArgs() not implemented for provider ${this.id}`);
  }

  /**
   * Whether this provider can handle the URL
   */
  canHandle(url) {
    return false;
  }
}

module.exports = { BaseProvider };
