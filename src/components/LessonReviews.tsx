import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  student_name: string;
  is_own: boolean;
}

interface Props {
  lessonId: string;
  studentId: string | null;
}

const LessonReviews = ({ lessonId, studentId }: Props) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [myReviewId, setMyReviewId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("lesson_reviews" as any)
        .select("id, rating, comment, created_at, student_id, students(first_name, second_name)")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: false });

      if (data) {
        const mapped = (data as any[]).map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment || "",
          created_at: r.created_at,
          student_name: r.students
            ? `${r.students.first_name || ""} ${r.students.second_name || ""}`.trim() || "طالب"
            : "طالب",
          is_own: r.student_id === studentId,
        }));
        setReviews(mapped);

        // Calculate average
        if (mapped.length > 0) {
          setAvgRating(Math.round((mapped.reduce((s, r) => s + r.rating, 0) / mapped.length) * 10) / 10);
        }

        // Set own review if exists
        const own = mapped.find((r) => r.is_own);
        if (own) {
          setMyRating(own.rating);
          setMyComment(own.comment);
          setMyReviewId(own.id);
        }
      }
      setLoading(false);
    };
    fetchReviews();
  }, [lessonId, studentId]);

  const handleSubmitReview = async () => {
    if (!studentId || myRating === 0) return;
    setSubmitting(true);

    if (myReviewId) {
      // Update
      const { error } = await supabase
        .from("lesson_reviews" as any)
        .update({ rating: myRating, comment: myComment.trim() })
        .eq("id", myReviewId);
      if (error) {
        toast({ variant: "destructive", title: error.message });
      } else {
        toast({ title: "تم تحديث تقييمك" });
        setReviews((prev) =>
          prev.map((r) => r.id === myReviewId ? { ...r, rating: myRating, comment: myComment.trim() } : r)
        );
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from("lesson_reviews" as any)
        .insert({ lesson_id: lessonId, student_id: studentId, rating: myRating, comment: myComment.trim() })
        .select("id")
        .single();
      if (error) {
        toast({ variant: "destructive", title: error.message });
      } else {
        toast({ title: "تم إضافة تقييمك" });
        setMyReviewId((data as any).id);
        setReviews((prev) => [{
          id: (data as any).id, rating: myRating, comment: myComment.trim(),
          created_at: new Date().toISOString(), student_name: "أنت", is_own: true,
        }, ...prev]);
      }
    }

    // Recalculate avg
    const updatedReviews = myReviewId
      ? reviews.map((r) => r.id === myReviewId ? { ...r, rating: myRating } : r)
      : [{ rating: myRating } as any, ...reviews];
    if (updatedReviews.length > 0) {
      setAvgRating(Math.round((updatedReviews.reduce((s: number, r: any) => s + r.rating, 0) / updatedReviews.length) * 10) / 10);
    }

    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Average Rating */}
      <Card>
        <CardContent className="py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="text-2xl font-bold text-foreground">{avgRating || "—"}</span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
          <p className="text-xs text-muted-foreground">{reviews.length} تقييم</p>
        </CardContent>
      </Card>

      {/* My Review */}
      {studentId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{myReviewId ? "تعديل تقييمك" : "أضف تقييمك"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setMyRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= (hoverRating || myRating)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="أضف تعليقاً (اختياري)..."
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              className="resize-none text-sm"
              rows={2}
              maxLength={500}
            />
            <Button
              onClick={handleSubmitReview}
              disabled={myRating === 0 || submitting}
              size="sm"
              className="w-full"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : myReviewId ? "تحديث التقييم" : "إرسال التقييم"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> التقييمات
          </h3>
          {reviews.map((r) => (
            <Card key={r.id} className={r.is_own ? "border-primary/30 bg-primary/5" : ""}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{r.is_own ? "أنت" : r.student_name}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("ar")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonReviews;
