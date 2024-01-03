const Comment = require("../models/Comment");

module.exports = {
 
  createComment: async (req, res) => {
    try {
      const newComment = await Comment.create({
        comment: req.body.comment,
        post: req.params.id,
        likes: 0,
        user: req.user.id,
      });
      await newComment.save();
      console.log("Comment has been added!", newComment);
      const populatedComment = await newComment.populate('user');
      res.status(201).json({ comment: populatedComment })
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'Internal Server Error' })
    }
  },
  likeComment: async (req, res) => {
    try {
      const updatedComment = await Comment.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        },
        { new: true },
      );
      console.log("Likes +1");
      res.status(200).json({ comment: updatedComment})
    } catch (err) {
      console.log(err);
    }
  },
  deleteComment: async (req, res) => {
    try {
      // Find post by id
      let comment = await Comment.findById({ _id: req.params.id });
      // Delete post from db
      await Comment.deleteOne({ _id: req.params.id });
      console.log("Deleted Post");
      res.json({ message: 'Comment deleted successfully'})
    } catch (err) {
      console.error('Error deleting comment:', err);
      res.status(500).json({ message: 'Internal Serve Error' });
    }
  },
};
