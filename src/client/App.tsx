import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticlePage } from './pages/ArticlePage';
import { CategoryPage } from './pages/CategoryPage';
import { AboutPage } from './pages/AboutPage';
import { RecommendedPage } from './pages/RecommendedPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { NotFoundPage } from './pages/NotFoundPage';
import SupplementsPage from './pages/SupplementsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:slug" element={<ArticlePage />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/recommended" element={<RecommendedPage />} />
        <Route path="/supplements" element={<SupplementsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/assessments/:slug" element={<AssessmentPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
