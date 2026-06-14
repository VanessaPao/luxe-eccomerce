import { db } from "../firebase/admin.js";

/**
 * Obtiene todos los reviews de un producto.
 */
export async function getReviewsByProduct(productId) {
  const snapshot = await db
    .collection("products")
    .doc(productId)
    .collection("reviews")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
  }));
}

/**
 * Crea un review para un producto.
 */
export async function createReview(productId, reviewData) {
  const ref = db
    .collection("products")
    .doc(productId)
    .collection("reviews")
    .doc();

  const rating = Math.min(5, Math.max(1, parseInt(reviewData.rating, 10) || 0));

  const review = {
    userId: reviewData.userId,
    userName: reviewData.userName || "Anónimo",
    userPhoto: reviewData.userPhoto || null,
    text: reviewData.text.trim(),
    image: reviewData.image || null,
    rating: rating > 0 ? rating : null,
    likes: [],
    dislikes: [],
    createdAt: new Date(),
  };

  await ref.set(review);
  return ref.id;
}

/**
 * Elimina un review (solo admin).
 */
export async function deleteReview(productId, reviewId) {
  const ref = db
    .collection("products")
    .doc(productId)
    .collection("reviews")
    .doc(reviewId);

  const snap = await ref.get();
  if (!snap.exists) return false;

  await ref.delete();
  return true;
}

/**
 * Toggle like en un review.
 */
export async function toggleLike(productId, reviewId, userId) {
  const ref = db
    .collection("products")
    .doc(productId)
    .collection("reviews")
    .doc(reviewId);

  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();
  const likes = data.likes || [];
  const dislikes = data.dislikes || [];

  let newLikes, newDislikes;

  if (likes.includes(userId)) {
    newLikes = likes.filter((id) => id !== userId);
    newDislikes = dislikes;
  } else {
    newLikes = [...likes, userId];
    newDislikes = dislikes.filter((id) => id !== userId);
  }

  await ref.update({ likes: newLikes, dislikes: newDislikes });
  return { likes: newLikes, dislikes: newDislikes };
}

/**
 * Toggle dislike en un review.
 */
export async function toggleDislike(productId, reviewId, userId) {
  const ref = db
    .collection("products")
    .doc(productId)
    .collection("reviews")
    .doc(reviewId);

  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();
  const likes = data.likes || [];
  const dislikes = data.dislikes || [];

  let newLikes, newDislikes;

  if (dislikes.includes(userId)) {
    newDislikes = dislikes.filter((id) => id !== userId);
    newLikes = likes;
  } else {
    newDislikes = [...dislikes, userId];
    newLikes = likes.filter((id) => id !== userId);
  }

  await ref.update({ likes: newLikes, dislikes: newDislikes });
  return { likes: newLikes, dislikes: newDislikes };
}
