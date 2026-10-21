
/**
 * Lightweight in-memory inverted index for offline text search.
 *
 * Maps normalized terms to documents and their normalized term frequencies.
 * Supports multiple text fields, AND/OR queries, stop words, and ranked
 * search without external dependencies.
 */

export interface IndexOptions {
  /** Words excluded from indexing and searching. */
  stopWords?: Set<string>;
  /** Preserve case when tokenizing. Defaults to false. */
  caseSensitive?: boolean;
}

export interface SearchOptions {
  /** AND requires every query term; OR requires at least one. Defaults to AND. */
  operator?: 'AND' | 'OR';
  /** Minimum relevance score required for a result. */
  minScore?: number;
  /** Maximum number of results to return. */
  limit?: number;
}

export interface SearchResult<T> {
  document: T;
  score: number;
  matchedTokens: string[];
}

export class InvertedIndex<TDocument extends { id: string }> {
  private readonly documents = new Map<
    string,
    { document: TDocument; tokenCount: number }
  >();

  private readonly postings = new Map<string, Map<string, number>>();
  private readonly stopWords: Set<string>;
  private readonly caseSensitive: boolean;

  constructor(options: IndexOptions = {}) {
    this.caseSensitive = options.caseSensitive ?? false;
    this.stopWords = new Set(
      [...(options.stopWords ?? [])].map((word) => this.normalize(word)),
    );
  }

  private normalize(value: string): string {
    return this.caseSensitive ? value : value.toLowerCase();
  }

  private tokenize(text: string): string[] {
    return (text.match(/[\p{L}\p{N}]+/gu) ?? [])
      .map((token) => this.normalize(token))
      .filter((token) => !this.stopWords.has(token));
  }

  /**
   * Adds or replaces a document, indexing only the specified string fields.
   */
  addDocument(doc: TDocument, fields: (keyof TDocument)[]): void {
    if (typeof doc.id !== 'string' || doc.id.length === 0) {
      throw new TypeError('Document id must be a non-empty string.');
    }

    // Replacing an ID must not leave stale terms in the index.
    this.removeDocument(doc.id);

    const frequencies = new Map<string, number>();
    let tokenCount = 0;

    for (const field of fields) {
      const value = doc[field];
      if (typeof value !== 'string') continue;

      for (const token of this.tokenize(value)) {
        frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
        tokenCount++;
      }
    }

    this.documents.set(doc.id, { document: doc, tokenCount });

    if (tokenCount === 0) return;

    for (const [term, frequency] of frequencies) {
      let termPostings = this.postings.get(term);

      if (!termPostings) {
        termPostings = new Map<string, number>();
        this.postings.set(term, termPostings);
      }

      // Normalized TF: occurrences of the term / indexed document tokens.
      termPostings.set(doc.id, frequency / tokenCount);
    }
  }

  /** Removes a document and all of its term postings. */
  removeDocument(id: string): void {
    if (!this.documents.has(id)) return;

    this.documents.delete(id);

    for (const [term, termPostings] of this.postings) {
      termPostings.delete(id);

      if (termPostings.size === 0) {
        this.postings.delete(term);
      }
    }
  }

  /**
   * Searches exact terms and term prefixes, ranking matches by cumulative TF.
   * Prefix matching allows a query such as "pro" to match "project".
   */
  search(
    query: string,
    options: SearchOptions = {},
  ): SearchResult<TDocument>[] {
    const queryTerms = [...new Set(this.tokenize(query))];

    if (queryTerms.length === 0) return [];

    const operator = options.operator ?? 'AND';
    const minScore = options.minScore ?? 0;
    const limit = options.limit ?? Infinity;

    if (
      !['AND', 'OR'].includes(operator) ||
      !Number.isFinite(minScore) ||
      minScore < 0 ||
      !(limit === Infinity || (Number.isInteger(limit) && limit >= 0))
    ) {
      throw new RangeError('Invalid search options.');
    }

    if (limit === 0) return [];

    

    const vocabulary = [...this.postings.keys()];
    const scores = new Map<string, number>();
    const matchedByDocument = new Map<string, Set<string>>();

    // Track whether this is the first term in an AND query.
    let firstTerm = true;

    for (const queryTerm of queryTerms) {
      // Aggregate scores across exact and prefix matches for this query term.
      const termScores = new Map<string, number>();

      const matchingTerms = vocabulary.filter(
        (term) => term === queryTerm || term.startsWith(queryTerm),
      );

      for (const term of matchingTerms) {
        const termPostings = this.postings.get(term);
        if (!termPostings) continue;

        for (const [documentId, frequency] of termPostings) {
          termScores.set(
            documentId,
            (termScores.get(documentId) ?? 0) + frequency,
          );
        }
      }

      if (operator === 'AND') {
        if (firstTerm) {
          // Initialize candidates with documents matching the first query term.
          for (const [documentId, score] of termScores) {
            scores.set(documentId, score);
            matchedByDocument.set(documentId, new Set([queryTerm]));
          }
        } else {
          // Intersect candidates with each subsequent term's matching documents.
          for (const documentId of scores.keys()) {
            const termScore = termScores.get(documentId);

            if (termScore === undefined) {
              // A document missing any required term cannot satisfy AND.
              scores.delete(documentId);
              matchedByDocument.delete(documentId);
            } else {
              // Accumulate relevance scores for documents matching every term.
              scores.set(documentId, scores.get(documentId)! + termScore);
              matchedByDocument.get(documentId)!.add(queryTerm);
            }
          }
        }
      } else {
        // OR keeps documents matching any query term and accumulates their scores.
        for (const [documentId, score] of termScores) {
          scores.set(documentId, (scores.get(documentId) ?? 0) + score);

          let matched = matchedByDocument.get(documentId);
          if (!matched) {
            matched = new Set<string>();
            matchedByDocument.set(documentId, matched);
          }

          matched.add(queryTerm);
        }
      }

      firstTerm = false;
    }


    return [...scores.entries()]
      .filter(([id, score]) => {
        const matched = matchedByDocument.get(id);
        const matchesQuery =
          operator === 'OR' || matched?.size === queryTerms.length;

        return matchesQuery && score >= minScore;
      })
      .sort(([idA, scoreA], [idB, scoreB]) => {
        return scoreB - scoreA || idA.localeCompare(idB);
      })
      .slice(0, limit)
      .map(([id, score]) => ({
        document: this.documents.get(id)!.document,
        score,
        matchedTokens: [...(matchedByDocument.get(id) ?? [])].sort(),
      }));
  }

  /** Returns whether a document ID is indexed. */
  hasDocument(id: string): boolean {
    return this.documents.has(id);
  }

  /** Removes all documents and postings. */
  clear(): void {
    this.documents.clear();
    this.postings.clear();
  }

  /** Number of indexed documents, including documents with no searchable terms. */
  get documentCount(): number {
    return this.documents.size;
  }

  /** Number of unique indexed terms. */
  get termCount(): number {
    return this.postings.size;
  }
}

