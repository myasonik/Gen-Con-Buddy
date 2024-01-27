import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';
import Application from 'gen-con-buddy/app';
import config from 'gen-con-buddy/config/environment';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';

setApplication(Application.create(config.APP));

setup(QUnit.assert);

start();
