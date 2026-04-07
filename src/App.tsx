/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Layout from './components/Layout';
import CodeEditor from './components/Editor';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import LicenseModal from './components/LicenseModal';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <LicenseModal />
        <Layout>
            <div className="h-full w-full">
                <CodeEditor />
            </div>
        </Layout>
      </AppProvider>
    </ErrorBoundary>
  );
}
