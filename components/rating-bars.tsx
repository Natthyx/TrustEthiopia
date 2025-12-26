import React from 'react';

interface RatingDistribution {
  stars: string;
  percentage: number;
  fill: number;
}

interface RatingBarsProps {
  ratingDistribution: RatingDistribution[];
  averageRating?: number;
  totalReviews?: number;
}

export default function RatingBars({ ratingDistribution, averageRating = 0, totalReviews = 0 }: RatingBarsProps) {
  return (
    <div className="space-y-4">
      <div className="text-center pb-3 border-b">
        <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
        <div className="flex justify-center my-1">
          {[...Array(5)].map((_, i) => (
            <svg 
              key={i}
              className={`w-4 h-4 ${i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <div className="text-sm text-gray-600">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</div>
      </div>
      
      {ratingDistribution.map((rating) => (
        <div key={rating.stars} className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 w-16">{rating.stars}</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all" 
              style={{ width: `${rating.fill}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 w-10 text-right">{rating.percentage}%</span>
        </div>
      ))}
    </div>
  )
}