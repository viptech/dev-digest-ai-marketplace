import { Layout } from './components/Layout';
import { ArtifactPage } from './pages/ArtifactPage';
import { GettingStarted } from './pages/GettingStarted';
import { HomePage } from './pages/HomePage';
import { PluginPage } from './pages/PluginPage';
import { SearchPage } from './pages/SearchPage';
import { WhatsNew } from './pages/WhatsNew';
import { type Route, useHashRoute } from './router/useHashRoute';

interface RouteViewProps {
  route: Route;
}

function RouteView({ route }: RouteViewProps) {
  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'search':
      return <SearchPage />;
    case 'plugin':
      return <PluginPage pluginName={route.pluginName} />;
    case 'artifact':
      return <ArtifactPage artifactId={route.artifactId} />;
    case 'whats-new':
      return <WhatsNew />;
    case 'getting-started':
      return <GettingStarted />;
  }
}

export default function App() {
  const route = useHashRoute();

  return (
    <Layout>
      <RouteView route={route} />
    </Layout>
  );
}
