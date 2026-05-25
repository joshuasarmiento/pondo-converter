import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import AboutView from './views/AboutView.vue';
import PricesView from './views/PricesView.vue';
import AnalyticsView from './views/AnalyticsView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: AnalyticsView,
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView,
  },
  {
    path: '/prices',
    name: 'Prices',
    component: PricesView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
