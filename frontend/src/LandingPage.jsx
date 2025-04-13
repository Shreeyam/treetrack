import React from 'react';
import { Container, Navbar, Nav, Button, Row, Col, Card, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Leaf, Check, ListChecks, ArrowRight, Star } from 'lucide-react';

function App() {
    return (
        <div className="App">
            {/* Navigation Bar */}
            <Navbar bg="white" expand="lg" className="py-3 fixed-top shadow-sm">
                <Container>
                    <Navbar.Brand href="#home" className="d-flex align-items-center">
                        <Leaf className="me-2 text-primary" size={24} />
                        <span className="fw-bold text-primary">TreeTrack</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link href="#features">Features</Nav.Link>
                            <Nav.Link href="#how-it-works">How It Works</Nav.Link>
                            <Nav.Link href="#pricing">Pricing</Nav.Link>
                        </Nav>
                        <Button variant="primary" className="rounded-pill px-4">Open App</Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Hero Section */}
            <section className="hero py-5 mt-5">
                <Container className="py-5">
                    <Row className="align-items-center">
                        <Col lg={6} className="mb-5 mb-lg-0">
                            <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill">New Way to Track Projects</Badge>
                            <h1 className="display-4 fw-bold mb-4">Visualize Your Work with Powerful DAG Technology</h1>
                            <p className="lead text-muted mb-4">TreeTrack uses directed acyclic graphs to help you manage complex projects with ease. Visualize dependencies, track progress, and never miss a deadline again.</p>
                            <div className="d-flex gap-3">
                                <Button variant="primary" size="lg" className="rounded-pill px-4">Start For Free</Button>
                                <Button variant="outline-dark" size="lg" className="rounded-pill px-4">See Demo</Button>
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="rounded shadow bg-white p-3">
                                <div className="ratio ratio-16x9">
                                    <video className="rounded" autoPlay loop muted playsInline>
                                        <source src="/api/placeholder/640/360" type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Features Section */}
            <section id="features" className="py-5">
                <Container className="py-5">
                    <div className="text-center mb-5">
                        <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill">Features</Badge>
                        <h2 className="display-5 fw-bold">Why Project Managers Love TreeTrack</h2>
                        <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                            Our DAG-based approach revolutionizes how you visualize and manage project dependencies.
                        </p>
                    </div>

                    <Row className="g-4">
                        <Col md={4}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body className="p-4 text-center">
                                    <div className="feature-icon-container mb-3">
                                        <Sitemap className="text-primary" size={32} />
                                    </div>
                                    <Card.Title className="mb-3 fw-bold">Visual Dependencies</Card.Title>
                                    <Card.Text className="text-muted">
                                        See the relationships between tasks at a glance. Identify bottlenecks before they happen.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body className="p-4 text-center">
                                    <div className="feature-icon-container mb-3">
                                        <Check className="text-primary" size={32} />
                                    </div>
                                    <Card.Title className="mb-3 fw-bold">Critical Path Analysis</Card.Title>
                                    <Card.Text className="text-muted">
                                        Automatically identify the critical path in your project and focus on what matters most.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body className="p-4 text-center">
                                    <div className="feature-icon-container mb-3">
                                        <ListChecks className="text-primary" size={32} />
                                    </div>
                                    <Card.Title className="mb-3 fw-bold">Smart Task Management</Card.Title>
                                    <Card.Text className="text-muted">
                                        Prioritize tasks based on dependencies and team capacity for maximum efficiency.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="bg-light py-5">
                <Container className="py-5">
                    <Row className="align-items-center mb-5">
                        <Col lg={6} className="mb-4 mb-lg-0">
                            <div className="rounded shadow bg-white p-3">
                                <div className="ratio ratio-16x9">
                                    <video className="rounded" autoPlay loop muted playsInline>
                                        <source src="/api/placeholder/640/360" type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                        </Col>
                        <Col lg={6} className="ps-lg-5">
                            <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill">How It Works</Badge>
                            <h2 className="display-5 fw-bold mb-4">Map Your Project's Structure</h2>
                            <p className="lead text-muted mb-4">TreeTrack turns complex projects into clear visual maps. Create nodes for tasks, connect them to show dependencies, and watch as the critical path emerges.</p>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-primary-light rounded-circle p-2 me-3">
                                    <Check className="text-primary" size={16} />
                                </div>
                                <p className="m-0">Drag-and-drop interface makes DAG creation intuitive</p>
                            </div>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-primary-light rounded-circle p-2 me-3">
                                    <Check className="text-primary" size={16} />
                                </div>
                                <p className="m-0">Task dependencies are visually clear to all team members</p>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className="bg-primary-light rounded-circle p-2 me-3">
                                    <Check className="text-primary" size={16} />
                                </div>
                                <p className="m-0">Algorithmic scheduling optimizes your project timeline</p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="align-items-center">
                        <Col lg={6} className="order-lg-2 mb-4 mb-lg-0">
                            <div className="rounded shadow bg-white p-3">
                                <div className="ratio ratio-16x9">
                                    <video className="rounded" autoPlay loop muted playsInline>
                                        <source src="/api/placeholder/640/360" type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                        </Col>
                        <Col lg={6} className="order-lg-1 pe-lg-5">
                            <Badge bg="secondary" className="mb-3 px-3 py-2 rounded-pill">Team Collaboration</Badge>
                            <h2 className="display-5 fw-bold mb-4">Work Together Seamlessly</h2>
                            <p className="lead text-muted mb-4">Everyone on your team gets a clear view of the project structure. Updates propagate in real-time, showing the impact of changes on dependent tasks.</p>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-secondary-light rounded-circle p-2 me-3">
                                    <Check className="text-secondary" size={16} />
                                </div>
                                <p className="m-0">Real-time collaboration with unlimited team members</p>
                            </div>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-secondary-light rounded-circle p-2 me-3">
                                    <Check className="text-secondary" size={16} />
                                </div>
                                <p className="m-0">Customizable notifications for task dependencies</p>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className="bg-secondary-light rounded-circle p-2 me-3">
                                    <Check className="text-secondary" size={16} />
                                </div>
                                <p className="m-0">Role-based permissions for project management</p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-5">
                <Container className="py-5">
                    <div className="text-center mb-5">
                        <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill">Pricing</Badge>
                        <h2 className="display-5 fw-bold">Simple, Transparent Pricing</h2>
                        <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                            Choose the plan that fits your project management needs. All plans include our core DAG visualization tools.
                        </p>
                    </div>

                    <Row className="g-4">
                        <Col lg={4}>
                            <Card className="h-100 border-0 shadow-sm text-center">
                                <Card.Header className="bg-white border-0 pt-4">
                                    <h4 className="fw-bold">Free</h4>
                                    <h2 className="display-4 fw-bold">$0<small className="fs-5 text-muted">/month</small></h2>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <p className="text-muted mb-4">Perfect for individuals and small projects</p>
                                    <div className="d-flex align-items-center mb-3">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Up to 3 projects</p>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Basic DAG visualization</p>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Up to 5 team members</p>
                                    </div>
                                    <div className="d-flex align-items-center mb-4">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Community support</p>
                                    </div>
                                    <Button variant="outline-primary" className="rounded-pill w-100">Get Started</Button>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4}>
                            <Card className="h-100 border-0 shadow position-relative">
                                <div className="position-absolute top-0 start-50 translate-middle">
                                    <Badge bg="primary" className="px-3 py-2 rounded-pill">Most Popular</Badge>
                                </div>
                                <Card.Header className="bg-white border-0 pt-4 text-center">
                                    <h4 className="fw-bold">Plus</h4>
                                    <h2 className="display-4 fw-bold">$12<small className="fs-5 text-muted">/month</small></h2>
                                </Card.Header>
                                <Card.Body className="p-4 text-center">
                                    <p className="text-muted mb-4">Great for growing teams and multiple projects</p>
                                    <div className="d-flex align-items-center mb-3">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Unlimited projects</p>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Advanced DAG analytics</p>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Up to 15 team members</p>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Email support</p>
                                    </div>
                                    <div className="d-flex align-items-center mb-4">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Custom reporting</p>
                                    </div>
                                    <Button variant="primary" className="rounded-pill w-100">Try 14 Days Free</Button>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4}>
                            <Card className="h-100 border-0 shadow-sm text-center">
                                <Card.Header className="bg-white border-0 pt-4">
                                    <h4 className="fw-bold">Enterprise</h4>
                                    <h2 className="display-4 fw-bold">Custom<small className="fs-5 text-muted"></small></h2>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <p className="text-muted mb-4">For organizations with complex requirements</p>
                                    <div className="d-flex align-items-center mb-3">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Unlimited everything</p>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Dedicated account manager</p>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">Custom integrations</p>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">24/7 priority support</p>
                                    </div>
                                    <div className="d-flex align-items-center mb-4">
                                        <Check className="text-primary me-3" size={16} />
                                        <p className="m-0 text-start">On-premise deployment option</p>
                                    </div>
                                    <Button variant="outline-primary" className="rounded-pill w-100">Contact Sales</Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Testimonials Section */}
            <section className="bg-light py-5">
                <Container className="py-5">
                    <div className="text-center mb-5">
                        <Badge bg="secondary" className="mb-3 px-3 py-2 rounded-pill">Testimonials</Badge>
                        <h2 className="display-5 fw-bold">Loved by Project Managers</h2>
                        <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                            See what our customers are saying about TreeTrack
                        </p>
                    </div>

                    <Row className="g-4">
                        <Col md={4}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body className="p-4">
                                    <div className="mb-3">
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                    </div>
                                    <p className="mb-4">"TreeTrack's DAG visualization completely changed how we manage our product development. We can now see bottlenecks before they happen."</p>
                                    <div className="d-flex align-items-center">
                                        <div className="bg-secondary rounded-circle me-3" style={{ width: '48px', height: '48px' }}></div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">Sarah Johnson</h6>
                                            <small className="text-muted">Product Manager, TechCorp</small>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body className="p-4">
                                    <div className="mb-3">
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                    </div>
                                    <p className="mb-4">"We reduced project completion time by 30% after implementing TreeTrack. The visual dependency mapping makes complex projects manageable."</p>
                                    <div className="d-flex align-items-center">
                                        <div className="bg-secondary rounded-circle me-3" style={{ width: '48px', height: '48px' }}></div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">Michael Chen</h6>
                                            <small className="text-muted">Engineering Director, Innovate Inc</small>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body className="p-4">
                                    <div className="mb-3">
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                        <Star className="text-warning" size={16} />
                                    </div>
                                    <p className="mb-4">"Our team finally understands how their work fits into the bigger picture. TreeTrack's visualization made our complex dependencies crystal clear."</p>
                                    <div className="d-flex align-items-center">
                                        <div className="bg-secondary rounded-circle me-3" style={{ width: '48px', height: '48px' }}></div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">Aisha Patel</h6>
                                            <small className="text-muted">Project Lead, CreativeWorks</small>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* CTA Section */}
            <section className="bg-primary text-white py-5">
                <Container className="py-5 text-center">
                    <h2 className="display-5 fw-bold mb-4">Ready to Transform Your Project Management?</h2>
                    <p className="lead mb-4 mx-auto" style={{ maxWidth: '700px' }}>
                        Join thousands of teams already using TreeTrack to visualize dependencies and deliver projects on time.
                    </p>
                    <Button variant="light" size="lg" className="rounded-pill px-4 me-3 text-primary">
                        Start Your Free Trial <ArrowRight className="ms-2" size={16} />
                    </Button>
                    <Button variant="outline-light" size="lg" className="rounded-pill px-4">
                        Schedule a Demo
                    </Button>
                </Container>
            </section>

            {/* Footer */}
            <footer className="bg-dark text-white py-5">
                <Container>
                    <Row className="g-4">
                        <Col md={4}>
                            <div className="d-flex align-items-center mb-3">
                                <Leaf className="me-2 text-primary" size={24} />
                                <span className="fw-bold text-primary h5 mb-0">TreeTrack</span>
                            </div>
                            <p className="text-muted">Revolutionizing project management with directed acyclic graph visualization.</p>
                        </Col>
                        <Col md={2}>
                            <h5 className="mb-3">Product</h5>
                            <ul className="list-unstyled">
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Features</a></li>
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Use Cases</a></li>
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Integrations</a></li>
                                <li><a href="#" className="text-muted text-decoration-none">Changelog</a></li>
                            </ul>
                        </Col>
                        <Col md={2}>
                            <h5 className="mb-3">Resources</h5>
                            <ul className="list-unstyled">
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Documentation</a></li>
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Tutorials</a></li>
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Blog</a></li>
                                <li><a href="#" className="text-muted text-decoration-none">Community</a></li>
                            </ul>
                        </Col>
                        <Col md={2}>
                            <h5 className="mb-3">Company</h5>
                            <ul className="list-unstyled">
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">About Us</a></li>
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Careers</a></li>
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Contact</a></li>
                                <li><a href="#" className="text-muted text-decoration-none">Legal</a></li>
                            </ul>
                        </Col>
                        <Col md={2}>
                            <h5 className="mb-3">Support</h5>
                            <ul className="list-unstyled">
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Help Center</a></li>
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Status</a></li>
                                <li className="mb-2"><a href="#" className="text-muted text-decoration-none">Security</a></li>
                                <li><a href="#" className="text-muted text-decoration-none">Privacy</a></li>
                            </ul>
                        </Col>
                    </Row>
                    <hr className="my-4 bg-secondary" />
                    <div className="d-flex flex-column flex-md-row justify-content-between">
                        <p className="text-muted mb-3 mb-md-0">© 2025 TreeTrack. All rights reserved.</p>
                        <div>
                            <a href="#" className="text-muted me-3"><i className="fab fa-twitter"></i></a>
                            <a href="#" className="text-muted me-3"><i className="fab fa-linkedin"></i></a>
                            <a href="#" className="text-muted"><i className="fab fa-github"></i></a>
                        </div>
                    </div>
                </Container>
            </footer>
        </div>
    );
}

export default App;
