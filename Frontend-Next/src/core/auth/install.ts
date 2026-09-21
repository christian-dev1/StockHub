import { installAuthHooks } from '../api/http-client';
import { refreshSession } from './auth-api';
import { sessionStore } from './session-store';

installAuthHooks({ token: () => sessionStore.token(), refresh: refreshSession });
