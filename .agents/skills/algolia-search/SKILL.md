---
name: algolia-search
description: Expert patterns for Algolia search implementation, indexing
  strategies, React InstantSearch, and relevance tuning
risk: unknown
source: vibeship-spawner-skills (Apache 2.0)
date_added: 2026-02-27
---

# Algolia Search Integration

Expert patterns for Algolia search implementation, indexing strategies, React InstantSearch, and relevance tuning

## Patterns

### React InstantSearch with Hooks

Modern React InstantSearch setup using hooks for type-ahead search.

Uses react-instantsearch-hooks-web package with algoliasearch client.
Widgets are components that can be customized with classnames.

Key hooks:
- useSearchBox: Search input handling
- useHits: Access search results
- useRefinementList: Facet filtering
- usePagination: Result pagination
- useInstantSearch: Full state access

### Code_example

// lib/algolia.ts
import algoliasearch from 'algoliasearch/lite';

export const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!  // Search-only key!
);

export const INDEX_NAME = 'products';

// components/Search.tsx
'use client';
import { InstantSearch, SearchBox, Hits, Configure } from 'react-instantsearch';
import { searchClient, INDEX_NAME } from '@/lib/algolia';

function Hit({ hit }: { hit: ProductHit }) {
  return (
    
      {hit.name}
      {hit.description}
      ${hit.price}
    
  );
}

export function ProductSearch() {
  return (
    
      
      
      
    
  );
}

// Custom hook usage
import { useSearchBox, useHits, useInstantSearch } from 'react-instantsearch';

function CustomSearch() {
  co
