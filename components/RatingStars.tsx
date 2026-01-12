'use client';

import { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

interface RatingStarsProps {
  average?: number;
  count?: number;
  recipeId?: number;
  interactive?: boolean;
}

export default function RatingStars({ 
  average = 0, 
  count = 0, 
  recipeId, 
  interactive = false 
}: RatingStarsProps) {
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [localAverage, setLocalAverage] = useState(average);
  const [localCount, setLocalCount] = useState(count);

  // Check if user has already voted for this recipe
  useEffect(() => {
    if (!interactive || !recipeId) return;

    const sessionId = getOrCreateSessionId();
    const votedRecipes = getVotedRecipes();
    
    if (votedRecipes[recipeId]) {
      setHasVoted(true);
    }
  }, [interactive, recipeId]);

  // Get or create session ID
  function getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('smart-pantry-session');
    
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('smart-pantry-session', sessionId);
    }
    
    return sessionId;
  }

  // Get voted recipes from localStorage
  function getVotedRecipes(): Record<number, number> {
    const votedStr = localStorage.getItem('smart-pantry-voted-recipes');
    return votedStr ? JSON.parse(votedStr) : {};
  }

  // Save voted recipe to localStorage
  function saveVotedRecipe(recipeId: number, rating: number) {
    const votedRecipes = getVotedRecipes();
    votedRecipes[recipeId] = rating;
    localStorage.setItem('smart-pantry-voted-recipes', JSON.stringify(votedRecipes));
  }

  // Handle rating submission
  async function handleRating(rating: number) {
    if (!interactive || !recipeId || isSubmitting || hasVoted) return;

    setIsSubmitting(true);

    try {
      const sessionId = getOrCreateSessionId();
      
      const response = await fetch(`/api/recipes/${recipeId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, sessionId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state with new averages
        setLocalAverage(data.average_rating);
        setLocalCount(data.rating_count);
        setHasVoted(true);
        saveVotedRecipe(recipeId, rating);
      } else if (data.error === 'rate_limit') {
        // Silently disable voting on rate limit
        setHasVoted(true);
      } else if (data.error === 'already_voted') {
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render stars
  const renderStars = () => {
    const stars = [];
    const displayRating = interactive && hoveredRating > 0 ? hoveredRating : localAverage;

    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.round(displayRating);
      const StarComponent = isFilled ? StarIcon : StarOutline;

      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive || hasVoted || isSubmitting}
          onClick={() => handleRating(i)}
          onMouseEnter={() => interactive && !hasVoted && setHoveredRating(i)}
          onMouseLeave={() => interactive && !hasVoted && setHoveredRating(0)}
          className={`
            ${interactive && !hasVoted ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
            transition-transform duration-150
            ${hasVoted || isSubmitting ? 'opacity-50' : ''}
          `}
        >
          <StarComponent 
            className={`w-5 h-5 ${
              isFilled ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      );
    }

    return stars;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {renderStars()}
      </div>
      <span className="text-sm text-gray-600">
        {localCount > 0 ? (
          <>
            {localAverage.toFixed(1)} ({localCount} {localCount === 1 ? 'voto' : 'votos'})
          </>
        ) : (
          '(Sin votos)'
        )}
      </span>
    </div>
  );
}
