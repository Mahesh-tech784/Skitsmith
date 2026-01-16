import React, { useState, useEffect, useRef } from "react";
import "./BotList.scss";
import { Table, Pagination, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import ApiService from "../../../../services/Api.service";
import { toast } from "react-toastify";

const BotList = () => {
  const [bots, setBots] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const botsPerPage = 4;
  const cacheRef = useRef(null);
  const cacheTimeRef = useRef(null);
  const CACHE_DURATION = 5 * 60 * 1000; // Cache for 5 minutes

  useEffect(() => {
    fetchAllChatBots();
  }, []);

  const fetchAllChatBots = async () => {
    // Check cache first
    if (cacheRef.current && cacheTimeRef.current) {
      const timeSinceCache = Date.now() - cacheTimeRef.current;
      if (timeSinceCache < CACHE_DURATION) {
        setBots(cacheRef.current);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError("");
    let { data, error } = await ApiService.getAllChatBots({});

    if (error) {
      setError("Failed to load chatbot. Please refresh the page.");
      setLoading(false);
      return;
    }

    if (data && data.result) {
      // Cache the data
      cacheRef.current = data.result;
      cacheTimeRef.current = Date.now();
      setBots(data.result);
    } else {
      setError("No chatbots found. Please contact support.");
    }
    setLoading(false);
  };

  // Pagination logic
  const indexOfLastBot = currentPage * botsPerPage;
  const indexOfFirstBot = indexOfLastBot - botsPerPage;
  const currentBots = bots.slice(indexOfFirstBot, indexOfLastBot);
  const totalPages = Math.ceil(bots.length / botsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  let navigate = useNavigate();

  const goToPage = (url, id, namespace_id = "") => {
    navigate(`${url}?id=${id}&namespace_id=${namespace_id}`);
  };

  const LoadingSkeleton = () => (
    <div className="table-responsive">
      <Table className="align-middle">
        <tbody>
          {[1, 2].map((idx) => (
            <tr key={idx} style={{ opacity: 0.6 }}>
              <td>
                <div
                  style={{
                    height: "20px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "4px",
                    marginBottom: "8px",
                  }}
                />
              </td>
              <td>
                <div
                  style={{
                    height: "20px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "4px",
                  }}
                />
              </td>
              <td>
                <div
                  style={{
                    height: "20px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "4px",
                  }}
                />
              </td>
              <td>
                <div
                  style={{
                    height: "20px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "4px",
                  }}
                />
              </td>
              <td>
                <div
                  style={{
                    height: "32px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "4px",
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bot-list-container container-fluid">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Header Section */}
          <div className="bot-list-header mb-5">
            <div className="header-content">
              <h1 className="fw-bold mb-2">Your Creative Bots</h1>
              <p className="text-muted">Manage and interact with your SkitSmith chatbots</p>
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>Error:</strong> {error}
              <button
                className="btn btn-sm btn-outline-danger ms-2"
                onClick={fetchAllChatBots}
              >
                Retry
              </button>
            </div>
          ) : bots.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p className="empty-state-text">No bots available yet</p>
              <p className="empty-state-subtext">Create your first bot to get started</p>
            </div>
          ) : (
            <>
              {/* Bots Grid */}
              <div className="bots-grid">
                {currentBots.map((bot, index) => (
                  <div key={bot._id["$oid"]} className="bot-card">
                    <div className="bot-card-header">
                      <div className="bot-info">
                        <h5 className="bot-name">{bot?.bot_name}</h5>
                        <p className="bot-description">{bot?.description || "No description provided"}</p>
                      </div>
                      <div className="bot-badge">#{indexOfFirstBot + index + 1}</div>
                    </div>

                    <div className="bot-card-body">
                      <div className="bot-meta">
                        <div className="meta-item">
                          <span className="meta-label">Created</span>
                          <span className="meta-value">{formatDate(bot?.created_at["$date"])}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Bot ID</span>
                          <span className="meta-value bot-id">{bot._id["$oid"].substring(0, 8)}...</span>
                        </div>
                      </div>
                    </div>

                    <div className="bot-card-footer">
                      <Button
                        onClick={() => {
                          goToPage(
                            "/default/doc-upload",
                            bot._id["$oid"],
                            bot.namespace_id
                          );
                        }}
                        className="btn-action btn-upload"
                      >
                        <span className="btn-icon">📤</span> Upload Doc
                      </Button>
                      <Button
                        onClick={() => {
                          goToPage(
                            "/default/chat",
                            bot._id["$oid"],
                            bot.namespace_id
                          );
                        }}
                        className="btn-action btn-chat"
                      >
                        <span className="btn-icon">💬</span> Chat Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container mt-5">
                  <Pagination className="pagination-custom">
                    <Pagination.First
                      onClick={() => paginate(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    />

                    {(() => {
                      const pageNumbers = [];
                      const maxVisible = 3;
                      let start = Math.max(
                        1,
                        currentPage - Math.floor(maxVisible / 2)
                      );
                      let end = start + maxVisible - 1;

                      if (end > totalPages) {
                        end = totalPages;
                        start = Math.max(1, end - maxVisible + 1);
                      }

                      for (let i = start; i <= end; i++) {
                        pageNumbers.push(
                          <Pagination.Item
                            key={i}
                            active={i === currentPage}
                            onClick={() => paginate(i)}
                          >
                            {i}
                          </Pagination.Item>
                        );
                      }

                      return pageNumbers;
                    })()}

                    <Pagination.Next
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => paginate(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotList;
