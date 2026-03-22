import React, { useState } from 'react';
import { Star, X, MessageSquare, ShieldCheck } from 'lucide-react';

const RatingModal = ({ isOpen, onClose, driverName, onRatingComplete }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="rating-modal animate-slide-up">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>

                <div className="rating-header">
                    <div className="success-badge">
                        <ShieldCheck size={32} />
                    </div>
                    <h2>Trip Completed!</h2>
                    <p>How was your experience with <strong>{driverName}</strong>?</p>
                </div>

                <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            className={`star-btn ${(hover || rating) >= star ? 'active' : ''}`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                        >
                            <Star size={36} fill={(hover || rating) >= star ? 'currentColor' : 'none'} />
                        </button>
                    ))}
                </div>

                <div className="rating-questions">
                    <div className="q-item">
                        <span>On-time delivery?</span>
                        <div className="q-tags">
                            <button className="tag">Yes</button>
                            <button className="tag">No</button>
                        </div>
                    </div>
                </div>

                <div className="comment-box">
                    <MessageSquare size={18} className="comment-icon" />
                    <textarea
                        placeholder="Leave a comment about the service..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                </div>

                <button
                    className="btn btn-primary w-full submit-btn"
                    disabled={rating === 0}
                    onClick={() => onRatingComplete({ rating, comment })}
                >
                    Submit Review
                </button>
            </div>
        </div>
    );
};

export default RatingModal;
