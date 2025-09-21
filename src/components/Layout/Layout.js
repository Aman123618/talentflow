import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Users, Clipboard, BarChart3 } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Jobs',
      href: '/jobs',
      icon: Briefcase,
      current: location.pathname.startsWith('/jobs')
    },
    {
      name: 'Candidates',
      href: '/candidates',
      icon: Users,
      current: location.pathname.startsWith('/candidates')
    },
    {
      name: 'Kanban Board',
      href: '/kanban',
      icon: BarChart3,
      current: location.pathname.startsWith('/kanban')
    }
  ];

  return (
    <div className="layout">
      <div className="sidebar">
        <div>
          <h2>TalentFlow</h2>
          <nav>
            <ul>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={item.current ? 'active' : ''}
                    >
                      <Icon size={18} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;