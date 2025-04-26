import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export default function Error() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return (
      <div
        className="d-flex align-items-center justify-content-center vh-100"
        data-testid="error-page"
      >
        <div className="text-center" data-testid="error-response">
          <h1 data-testid="error-title">Oops!</h1>
          <h2 data-testid="error-status">{error.status}</h2>
          <p data-testid="error-status-text">{error.statusText}</p>
          <Link to="/" className="btn btn-primary mt-3" data-testid="back-to-home-button">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      data-testid="error-page"
    >
      <div className="text-center" data-testid="unexpected-error">
        <h1 data-testid="error-title">Oops!</h1>
        <p data-testid="error-message">Sorry, an unexpected error has occurred.</p>
        <Link to="/" className="btn btn-primary mt-3" data-testid="back-to-home-button">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
