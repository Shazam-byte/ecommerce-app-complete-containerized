import React from "react";
import { Server, Database, Cloud } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-bento-border bg-bento-bg/95 py-8 text-bento-text-bright">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          
          {/* Humble Human Label */}
          <div className="flex flex-col text-center sm:text-left">
            <span className="text-sm font-extrabold tracking-tight text-bento-text-bright">E-Catalog Platform</span>
            <span className="text-xs text-bento-text-muted uppercase tracking-wider">AWS Multi-Tier Architecture</span>
          </div>

          {/* Decoupled layer indicators (Human label with no tech larping, clean icons only) */}
          <div className="flex space-x-6">
            <div className="flex items-center space-x-1.5 text-xs text-bento-text-muted hover:text-bento-accent transition-colors">
              <Cloud className="h-4 w-4 text-bento-accent" />
              <span>Static S3 CDN</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-bento-text-muted hover:text-bento-accent transition-colors">
              <Server className="h-4 w-4 text-bento-accent" />
              <span>Express EC2 VM</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-bento-text-muted hover:text-bento-accent transition-colors">
              <Database className="h-4 w-4 text-bento-accent" />
              <span>RDS PostgreSQL</span>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-bento-text-muted">
            &copy; {new Date().getFullYear()} E-Catalog. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
