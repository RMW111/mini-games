mod board;
mod game;

use pyo3::prelude::*;
use pyo3::types::PyTuple;
use game::{GameState, Action, PHASE_MOVE, PHASE_PLACE};
use board::{WHITE, RED, EMPTY, WHITE_VIKING, RED_VIKING, RUNESTONE};

/// Python wrapper for GameState.
#[pyclass(name = "GameState")]
struct PyGameState {
    inner: GameState,
}

#[pymethods]
impl PyGameState {
    #[new]
    #[pyo3(signature = (board_size="small"))]
    fn new(board_size: &str) -> Self {
        PyGameState {
            inner: GameState::new(board_size),
        }
    }

    fn is_terminal(&self) -> bool {
        self.inner.is_terminal()
    }

    fn current_player(&self) -> u8 {
        self.inner.current_player()
    }

    #[getter]
    fn phase(&self) -> &str {
        if self.inner.phase == PHASE_MOVE {
            "move_viking"
        } else {
            "place_runestone"
        }
    }

    #[getter]
    fn winner(&self) -> Option<u8> {
        self.inner.winner
    }

    #[getter]
    fn white_score(&self) -> u32 {
        self.inner.white_score
    }

    #[getter]
    fn red_score(&self) -> u32 {
        self.inner.red_score
    }

    #[getter]
    fn board(&self) -> Vec<Vec<u8>> {
        self.inner.board.cells.clone()
    }

    /// Returns list of legal actions.
    /// Move actions: (from_r, from_c, to_r, to_c)
    /// Place actions: (row, col)
    /// Skip: "skip"
    fn legal_actions(&self, py: Python<'_>) -> PyResult<Vec<PyObject>> {
        let actions = self.inner.legal_actions();
        let mut result = Vec::with_capacity(actions.len());

        for action in &actions {
            let obj = match action {
                Action::Move(fr, fc, tr, tc) => {
                    PyTuple::new(py, &[*fr as i64, *fc as i64, *tr as i64, *tc as i64])?.into_any().unbind()
                }
                Action::Place(r, c) => {
                    PyTuple::new(py, &[*r as i64, *c as i64])?.into_any().unbind()
                }
                Action::Skip => {
                    "skip".into_pyobject(py)?.into_any().unbind()
                }
            };
            result.push(obj);
        }
        Ok(result)
    }

    /// Apply an action and return a new GameState.
    /// action: tuple (fr, fc, tr, tc) for move, (r, c) for place, or "skip"
    fn step(&self, py: Python<'_>, action: PyObject) -> PyResult<PyGameState> {
        let act = parse_action(py, &action)?;
        Ok(PyGameState {
            inner: self.inner.step(&act),
        })
    }

    fn rewards(&self) -> (f64, f64) {
        self.inner.rewards()
    }

    /// Get board row sizes.
    fn row_sizes(&self) -> Vec<usize> {
        self.inner.board.row_sizes.clone()
    }
}

fn parse_action(py: Python<'_>, action: &PyObject) -> PyResult<Action> {
    // Check if it's a string "skip"
    if let Ok(s) = action.extract::<String>(py) {
        if s == "skip" {
            return Ok(Action::Skip);
        }
        return Err(pyo3::exceptions::PyValueError::new_err(
            format!("Unknown action string: {}", s),
        ));
    }

    // It's a tuple
    let tuple = action.downcast_bound::<PyTuple>(py)?;
    match tuple.len() {
        4 => {
            let fr = tuple.get_item(0)?.extract::<usize>()?;
            let fc = tuple.get_item(1)?.extract::<usize>()?;
            let tr = tuple.get_item(2)?.extract::<usize>()?;
            let tc = tuple.get_item(3)?.extract::<usize>()?;
            Ok(Action::Move(fr, fc, tr, tc))
        }
        2 => {
            let r = tuple.get_item(0)?.extract::<usize>()?;
            let c = tuple.get_item(1)?.extract::<usize>()?;
            Ok(Action::Place(r, c))
        }
        _ => Err(pyo3::exceptions::PyValueError::new_err(
            "Action tuple must have 2 or 4 elements",
        )),
    }
}

#[pymodule]
fn ragnarocks_engine(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_class::<PyGameState>()?;
    m.add("WHITE", WHITE)?;
    m.add("RED", RED)?;
    m.add("EMPTY", EMPTY)?;
    m.add("WHITE_VIKING", WHITE_VIKING)?;
    m.add("RED_VIKING", RED_VIKING)?;
    m.add("RUNESTONE", RUNESTONE)?;
    m.add("PHASE_MOVE", "move_viking")?;
    m.add("PHASE_PLACE", "place_runestone")?;
    m.add("SKIP", "skip")?;
    m.add("SMALL_ROW_SIZES", board::SMALL_ROW_SIZES.to_vec())?;
    m.add("LARGE_ROW_SIZES", board::LARGE_ROW_SIZES.to_vec())?;
    Ok(())
}
