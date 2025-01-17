import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export default function Error() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="text-center">
          <h1>Oops!</h1>
          <h2>{error.status}</h2>
          <p>{error.statusText}</p>
          <Link to="/" className="btn btn-primary mt-3">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <div className="text-center">
        <h1>Oops!</h1>
        <p>Sorry, an unexpected error has occurred.</p>
        <Link to="/" className="btn btn-primary mt-3">Back to Home</Link>
      </div>
    </div>
  );
}
