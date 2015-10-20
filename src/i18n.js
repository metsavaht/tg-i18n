import is from 'is';
import Jed from 'jed';
import moment from 'moment';

import {getConfig, getLogger} from './config';


class I18N {
    constructor(activeLanguage, defaultLanguage, localeData) {
        if (process.env.NODE_ENV !== 'production') {
            if (!is.object(localeData) || Object.keys(localeData).length === 0) {
                getLogger().error('No languages defined');
                localeData = {};
            }

            if (!defaultLanguage) {
                getLogger().error('Default language not defined');
            }

            if (is.undef(localeData[defaultLanguage])) {
                getLogger().error('Default language not in available languages');
            }
        }

        this.localeData = localeData;
        this.requestLanguage = activeLanguage || defaultLanguage;

        this._activeLang = null;
        this.$t = null;

        // Set the language active
        this.setActiveLang(activeLanguage || defaultLanguage);
    }

    setActiveLang(theLanguage) {
        if (!is.undef(this.localeData[theLanguage])) {
            if (this._activeLang !== theLanguage) {
                if (!this.localeData[theLanguage]) {
                    getLogger().warning(`Missing locale_data for language ${theLanguage}`);
                    return;
                }

                this._activeLang = theLanguage;
                this.$t = new Jed({
                    domain: getConfig('domain'),
                    locale_data: {
                        django: JSON.parse(this.localeData[theLanguage] || '{}')
                    }
                });

                // Reload if the language was changed at runtime
                if (typeof window !== 'undefined' && theLanguage !== this.requestLanguage) {
                    window.location.reload();
                }
            }
        }

        // Also fix moment locale
        moment.locale(theLanguage === 'en-us' ? 'en-gb' : theLanguage);
    }

    gettext(key) {
        if (!this.$t) {
            return key;
        }

        return this.$t.gettext.apply(this.$t, [].slice.call(arguments));
    }

    pgettext(context, key) {
        if (!this.$t) {
            return key;
        }

        return this.$t.pgettext.apply(this.$t, [].slice.call(arguments));
    }

    ngettext(singularKey, pluralKey, value) {
        if (!this.$t) {
            return (value === 0 || value === 1) ? singularKey : pluralKey;
        }

        return this.$t.ngettext.apply(this.$t, [].slice.call(arguments));
    }

    npgettext(context, singularKey, pluralKey, value) {
        if (!this.$t) {
            return (value === 0 || value === 1) ? singularKey : pluralKey;
        }

        return this.$t.npgettext.apply(this.$t, [].slice.call(arguments));
    }

    sprintf(out) {
        if (!this.$t) {
            return out;
        }

        return this.$t.sprintf.apply(this.$t, [].slice.call(arguments));
    }

    static initFromConfig() {
        return new I18N(
            getConfig('activeLanguage'),
            getConfig('languageCode'),
            getConfig('localeData')
        );
    }
}

const i18n = I18N.initFromConfig();
export const gettext = i18n.gettext.bind(i18n);
export const pgettext = i18n.pgettext.bind(i18n);
export const ngettext = i18n.ngettext.bind(i18n);
export const npgettext = i18n.npgettext.bind(i18n);
export const sprintf = i18n.sprintf.bind(i18n);
export default i18n;