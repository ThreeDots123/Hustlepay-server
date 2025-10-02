# Backend Development To-Do (from User Stories)

## 1. Core Setup

- [x] Initialize NestJS project with Postgres + TypeORM.
- [x] Configure dotenv and environment variables.
- [x] Setup TypeORM migrations.
- [x] Implement global pipes for validation/transform (class-validator, class-transformer).
- [x] Add JWT authentication & Passport.
- [x] Configure logging and error handling middleware.

## 2. Authentication & User Management

- [x] Implement User entity (common fields: id, email, passwordHash, role).
- [x] Roles: CLIENT, FREELANCER, ADMIN.
- [x] Register (signup) endpoint:
  - [x] Client registration (basic profile).
  - [x] Freelancer registration (profile + skills).
- [x] Login endpoint (JWT issue).
- [x] Password hashing with bcrypt.
- [x] JWT Guard & Role Guard for protected routes.
- [ ] Password reset (Add emailing template)
- [x] User profile update (name, bio, skills, etc).
- [x] Email verification flow (optional MVP: skip).
- [x] User status may be required later?
  - [ ] Add to dto user response (Not decided yet)
- [x] Catch email already exists
- [x] Event to manage user registeration workflow - FIX - ENUM DTO FOR USER ROLE ON USER CREATION

- [ ] Add Avatar url and rating to freelancers

## 3. Freelancer Side

- [x] Gig entity (title, description, category, price, ownerId).
- [ ] CRUD for gigs:
  - [x] Create gig.
  - [x] Retrieve single gig.
  - [x] Retrieve all gigs (Add pagination).
  - [ ] Retrieve all gigs (Search filtering).
  - [ ] Update gig. (Update packages and media)
  - [x] Delete gig.
  - [ ] Get freelancer’s gigs. (From Client POV?)
- [ ] View orders assigned to freelancer.
- [ ] Submit deliverables for orders.
- [ ] Earnings tracking (wallet balance).

## 4. Client Side

- [ ] Project entity (title, description, budget, deadline, postedBy).
- [ ] Post new project.
- [ ] View list of projects.
- [ ] Receive freelancer proposals.
- [ ] Accept proposal → create Order.
- [ ] Pay via escrow (mark as paid).
- [ ] Leave review after completion.

## 5. Order & Transaction System

- [ ] Order entity (clientId, freelancerId, gigId or projectId, status).
- [ ] Order lifecycle:
  - [ ] CREATED → IN_PROGRESS → SUBMITTED → COMPLETED / CANCELLED.
- [ ] Transaction entity (amount, type [escrow, payout, refund], orderId).
- [ ] Escrow service:
  - [ ] Hold funds when client pays.
  - [ ] Release to freelancer when order is completed.
- [ ] Refund flow if dispute resolved in client’s favor.

## 6. Messaging & Communication

- [ ] Conversation entity (clientId, freelancerId).
- [ ] Message entity (conversationId, senderId, content, attachments).
- [ ] Endpoints:
  - [ ] Start conversation.
  - [ ] Send message.
  - [ ] Get conversation history.
- [ ] Optional: WebSocket integration for real-time chat (future enhancement).

## 7. Reviews & Ratings

- [ ] Review entity (orderId, reviewerId, revieweeId, rating, comment).
- [ ] Endpoints:
  - [ ] Leave review after order completion.
  - [ ] Get average rating for freelancer.
- [ ] Prevent duplicate reviews for the same order.

## 8. Admin & Moderation

- [ ] Admin dashboard endpoints:
  - [ ] List all users, gigs, projects, orders.
  - [ ] Ban/suspend user.
  - [ ] Resolve disputes.
  - [ ] View transactions & platform revenue.
- [ ] Reporting system (basic: report a user/gig).

## 9. Platform Finance

- [ ] Commission model (platform takes percentage of each transaction).
- [ ] Track platform earnings.
- [ ] Withdrawal request entity (freelancer requests payout).
- [ ] Admin approves/marks withdrawal as paid.

## 10. Notifications

- [ ] Simple notifications system:
  - [ ] New proposal.
  - [ ] New order.
  - [ ] Order status updates.
- [ ] Store in DB (Notification entity).
- [ ] Expose via REST API.
- [ ] (Future: push/email notifications).

## 11. Infrastructure & Deployment

- [ ] Add config for multiple environments (dev, staging, prod).
- [ ] Setup Dockerfile for backend.
- [ ] Deploy to cloud (e.g., AWS/GCP/Heroku).
- [ ] Add CI/CD pipeline (GitHub Actions).
- [ ] Setup monitoring/logging (Winston, Sentry).

## 12. Future Enhancements (Post-MVP)

- [ ] Payment gateway integration (Paystack, Stripe, Coinbase Commerce).
- [ ] Real-time messaging with WebSockets.
- [ ] Advanced search/filter for gigs & freelancers.
- [ ] Recommendation system (AI/ML).
- [ ] Escrow automation with smart contracts (if blockchain integrated).

# Tell Dave

- Open Mailjet for emailing
- Open Cloudinary for saving mdia
